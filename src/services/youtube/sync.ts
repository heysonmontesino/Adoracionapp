/**
 * YouTube → Firestore sync service.
 *
 * Designed to run as:
 *   - A Node.js admin script (ts-node src/services/youtube/sync.ts)
 *   - A Firebase Cloud Function (onSchedule or onRequest)
 *
 * The app only reads from Firestore. This service writes to it.
 *
 * Collections written:
 *   youtube_videos/{youtubeVideoId}  — one doc per video (upserted, idempotent)
 *   sermon_series/{slug}             — one doc per detected series (upserted)
 *
 * Usage:
 *   YOUTUBE_API_KEY=... CHANNEL_HANDLE=@IGLESIAADORACIONCOLOMBIA ts-node sync.ts
 */

import {
  resolveChannelHandle,
  fetchUploadsPlaylist,
  fetchVideosBatch,
  getBestThumbnailUrl,
} from './client'
import {
  parseTitle,
  classifyContentType,
  extractPreacherName,
  buildSeriesSlug,
} from '../../features/content/videos/engine/parser'
import type { VideoDocument, SermonSeries, SyncStatus } from '../../features/content/videos/types'
import type { YouTubeVideoItem } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncConfig {
  apiKey: string
  channelHandle: string
  /** How many videos to fetch from the uploads playlist (default: 200) */
  maxVideos?: number
  /** Firestore adapter — injected so this module works in both admin SDK and app SDK contexts */
  firestore: FirestoreSyncAdapter
}

export interface FirestoreSyncAdapter {
  upsertVideo(id: string, data: Omit<VideoDocument, 'id'>): Promise<void>
  upsertSeries(slug: string, data: Omit<SermonSeries, 'id'>): Promise<void>
  getExistingVideoIds(ids: string[]): Promise<Set<string>>
  serverTimestamp(): unknown
}

export interface SyncResult {
  processed: number
  created: number
  updated: number
  skipped: number
  seriesUpserted: number
  errors: Array<{ videoId: string; message: string }>
}

// ─── Normalization ────────────────────────────────────────────────────────────

function buildVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

/**
 * Transform a raw YouTube video item into a VideoDocument.
 * All pure computation — no I/O.
 */
export function normalizeVideoItem(
  item: YouTubeVideoItem,
  channelHandle: string,
  channelId: string,
  now: unknown,
): Omit<VideoDocument, 'id'> {
  const { snippet, contentDetails } = item
  const parsed = parseTitle(snippet.title)
  const contentType = classifyContentType({
    title: snippet.title,
    description: snippet.description,
    liveBroadcastContent: snippet.liveBroadcastContent,
  })

  const seriesSlug =
    parsed.seriesName !== null ? buildSeriesSlug(parsed.seriesName) : null

  return {
    youtubeVideoId: item.id,
    title: parsed.cleanTitle,
    rawTitle: snippet.title,
    description: snippet.description,
    publishedAt: new Date(snippet.publishedAt) as unknown as VideoDocument['publishedAt'],
    thumbnailUrl: getBestThumbnailUrl(snippet.thumbnails),
    videoUrl: buildVideoUrl(item.id),
    duration: contentDetails.duration,
    contentType,
    isLive: snippet.liveBroadcastContent === 'live',
    isUpcoming: snippet.liveBroadcastContent === 'upcoming',
    seriesSlug,
    seriesName: parsed.seriesName,
    episodeNumber: parsed.episodeNumber,
    internalOrder: parsed.internalOrder,
    preacherName: extractPreacherName(snippet.description),
    sourceChannelHandle: channelHandle,
    sourceChannelId: channelId,
    tags: snippet.tags ?? [],
    featured: false,
    syncStatus: 'synced' as SyncStatus,
    syncedAt: now as VideoDocument['syncedAt'],
  }
}

// ─── Series accumulation ──────────────────────────────────────────────────────

function accumulateSeries(
  map: Map<string, { name: string; episodeCount: number; latestPublishedAt: Date | null }>,
  video: Omit<VideoDocument, 'id'>,
): void {
  if (!video.seriesSlug || !video.seriesName) return

  const existing = map.get(video.seriesSlug)
  const publishedDate =
    video.publishedAt instanceof Date ? video.publishedAt : null

  if (!existing) {
    map.set(video.seriesSlug, {
      name: video.seriesName,
      episodeCount: 1,
      latestPublishedAt: publishedDate,
    })
  } else {
    existing.episodeCount += 1
    if (
      publishedDate &&
      (!existing.latestPublishedAt || publishedDate > existing.latestPublishedAt)
    ) {
      existing.latestPublishedAt = publishedDate
    }
  }
}

// ─── Main sync entry point ────────────────────────────────────────────────────

export async function syncChannel(config: SyncConfig): Promise<SyncResult> {
  const { apiKey, channelHandle, maxVideos = 200, firestore } = config

  const result: SyncResult = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    seriesUpserted: 0,
    errors: [],
  }

  // 1. Resolve handle → channelId + uploadsPlaylistId
  const { channelId, uploadsPlaylistId } = await resolveChannelHandle(channelHandle, apiKey)

  // 2. Fetch video IDs from uploads playlist
  const videoIds = await fetchUploadsPlaylist(uploadsPlaylistId, apiKey, maxVideos)

  // 3. Check which video IDs already exist (for created vs updated tracking)
  const existingIds = await firestore.getExistingVideoIds(videoIds)

  // 4. Fetch full metadata in batches of 50 (YouTube API limit)
  const BATCH_SIZE = 50
  const seriesMap = new Map<
    string,
    { name: string; episodeCount: number; latestPublishedAt: Date | null }
  >()

  for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
    const batch = videoIds.slice(i, i + BATCH_SIZE)

    let batchResponse
    try {
      batchResponse = await fetchVideosBatch(batch, apiKey)
    } catch (err) {
      for (const id of batch) {
        result.errors.push({ videoId: id, message: String(err) })
      }
      continue
    }

    const now = firestore.serverTimestamp()

    for (const item of batchResponse.items) {
      result.processed++

      try {
        const normalized = normalizeVideoItem(item, channelHandle, channelId, now)
        await firestore.upsertVideo(item.id, normalized)

        accumulateSeries(seriesMap, normalized)

        if (existingIds.has(item.id)) {
          result.updated++
        } else {
          result.created++
        }
      } catch (err) {
        result.errors.push({ videoId: item.id, message: String(err) })
      }
    }
  }

  // 5. Upsert series documents
  const now = firestore.serverTimestamp()

  for (const [slug, meta] of seriesMap.entries()) {
    try {
      const seriesData: Omit<SermonSeries, 'id'> = {
        slug,
        name: meta.name,
        description: null,
        thumbnailUrl: null,
        episodeCount: meta.episodeCount,
        latestEpisodeAt:
          meta.latestPublishedAt as unknown as SermonSeries['latestEpisodeAt'],
        createdAt: now as SermonSeries['createdAt'],
      }
      await firestore.upsertSeries(slug, seriesData)
      result.seriesUpserted++
    } catch (err) {
      result.errors.push({ videoId: `series:${slug}`, message: String(err) })
    }
  }

  return result
}
