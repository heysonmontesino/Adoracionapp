import { limit, orderBy, where } from 'firebase/firestore'
import { getDocument, queryDocuments } from '../../../services/firebase/firestore'
import { PAGINATION } from '../../../config/constants'
import { CHURCH_YOUTUBE } from '../../../shared/constants/church'
import { fetchUploadsPlaylist, fetchVideosBatch, getBestThumbnailUrl } from '../../../services/youtube/client'
import { buildSeriesSlug, classifyContentType, extractPreacherName, parseTitle } from './engine/parser'
import type { VideoDocument, SermonSeries } from './types'
import type { ContentFeed, FeedVideo } from './feed/types'
import type { YouTubeVideoItem } from '../../../services/youtube/types'

const VIDEOS_COLLECTION = 'youtube_videos'
const SERIES_COLLECTION = 'sermon_series'
const CONTENT_API_BASE_URL = process.env.EXPO_PUBLIC_CONTENT_API_URL
const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY
const YOUTUBE_CHANNEL_ID = process.env.EXPO_PUBLIC_YOUTUBE_CHANNEL_ID || CHURCH_YOUTUBE.channelId
const FALLBACK_UPLOAD_SCAN_LIMIT = 25

function buildVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

function getUploadsPlaylistId(channelId: string): string | null {
  const normalized = channelId.trim()
  if (!normalized.startsWith('UC')) return null
  return `UU${normalized.slice(2)}`
}

function isSermonTitle(title: string): boolean {
  return classifyContentType({ title, liveBroadcastContent: 'none' }) === 'sermon'
}

function normalizeYouTubeItemToVideoDocument(item: YouTubeVideoItem): VideoDocument {
  const parsed = parseTitle(item.snippet.title)
  const seriesSlug = parsed.seriesName ? buildSeriesSlug(parsed.seriesName) : null
  const publishedAt = new Date(item.snippet.publishedAt) as unknown as VideoDocument['publishedAt']
  const syncedAt = new Date() as unknown as VideoDocument['syncedAt']

  return {
    id: item.id,
    youtubeVideoId: item.id,
    title: parsed.cleanTitle,
    rawTitle: item.snippet.title,
    description: item.snippet.description,
    publishedAt,
    thumbnailUrl: getBestThumbnailUrl(item.snippet.thumbnails),
    videoUrl: buildVideoUrl(item.id),
    duration: item.contentDetails.duration,
    contentType: 'sermon',
    isLive: false,
    isUpcoming: false,
    seriesSlug,
    seriesName: parsed.seriesName,
    episodeNumber: parsed.episodeNumber,
    internalOrder: parsed.internalOrder,
    preacherName: extractPreacherName(item.snippet.description),
    sourceChannelHandle: CHURCH_YOUTUBE.channelUrl,
    sourceChannelId: item.snippet.channelId,
    tags: item.snippet.tags ?? [],
    featured: false,
    syncStatus: 'synced',
    syncedAt,
  }
}

function normalizeFeedVideoToVideoDocument(video: FeedVideo): VideoDocument {
  const parsed = parseTitle(video.title)
  const seriesSlug = parsed.seriesName ? buildSeriesSlug(parsed.seriesName) : null
  const publishedAt = video.publishedAt
    ? new Date(video.publishedAt)
    : new Date()
  const videoUrl = video.url ?? buildVideoUrl(video.id)

  return {
    id: video.id,
    youtubeVideoId: video.id,
    title: parsed.cleanTitle,
    rawTitle: video.title,
    description: '',
    publishedAt: publishedAt as unknown as VideoDocument['publishedAt'],
    thumbnailUrl: video.thumbnail,
    videoUrl,
    duration: '',
    contentType: 'sermon',
    isLive: false,
    isUpcoming: false,
    seriesSlug,
    seriesName: parsed.seriesName,
    episodeNumber: parsed.episodeNumber,
    internalOrder: parsed.internalOrder,
    preacherName: null,
    sourceChannelHandle: CHURCH_YOUTUBE.channelUrl,
    sourceChannelId: YOUTUBE_CHANNEL_ID,
    tags: [],
    featured: false,
    syncStatus: 'pending',
    syncedAt: new Date() as unknown as VideoDocument['syncedAt'],
  }
}

async function fetchLatestSermonFromContentApi(): Promise<VideoDocument | null> {
  if (!CONTENT_API_BASE_URL || !CONTENT_API_BASE_URL.startsWith('http')) return null

  const response = await fetch(`${CONTENT_API_BASE_URL}/v1/content/feed`)
  if (!response.ok) return null

  const feed = await response.json() as ContentFeed
  const latestSermon = feed.latest.find((video) => isSermonTitle(video.title))
  return latestSermon ? normalizeFeedVideoToVideoDocument(latestSermon) : null
}

async function fetchLatestSermonFromYouTube(): Promise<VideoDocument | null> {
  const apiKey = YOUTUBE_API_KEY?.trim()
  const channelId = YOUTUBE_CHANNEL_ID.trim()
  const uploadsPlaylistId = getUploadsPlaylistId(channelId)

  if (!apiKey || !uploadsPlaylistId) return null

  const videoIds = await fetchUploadsPlaylist(uploadsPlaylistId, apiKey, FALLBACK_UPLOAD_SCAN_LIMIT)
  if (videoIds.length === 0) return null

  const details = await fetchVideosBatch(videoIds, apiKey)
  const sermon = details.items
    .filter((item) => classifyContentType({
      title: item.snippet.title,
      description: item.snippet.description,
      liveBroadcastContent: item.snippet.liveBroadcastContent,
    }) === 'sermon')
    .sort((a, b) => (
      new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime()
    ))[0]

  return sermon ? normalizeYouTubeItemToVideoDocument(sermon) : null
}

async function fetchLatestSermonFallback(): Promise<VideoDocument | null> {
  try {
    const fromContentApi = await fetchLatestSermonFromContentApi()
    if (fromContentApi) return fromContentApi
  } catch (error) {
    console.warn('[Videos] Content API fallback failed', error)
  }

  try {
    return await fetchLatestSermonFromYouTube()
  } catch (error) {
    console.warn('[Videos] YouTube fallback failed', error)
    return null
  }
}

// ─── Live & upcoming ──────────────────────────────────────────────────────────

/** Returns the active live stream, or null if none. */
export async function fetchLiveStream(): Promise<VideoDocument | null> {
  const results = await queryDocuments<VideoDocument>(
    VIDEOS_COLLECTION,
    where('isLive', '==', true),
    limit(1),
  )
  return results[0] ?? null
}

/** Returns scheduled upcoming streams ordered by publication date. */
export async function fetchUpcomingStreams(): Promise<VideoDocument[]> {
  return queryDocuments<VideoDocument>(
    VIDEOS_COLLECTION,
    where('isUpcoming', '==', true),
    orderBy('publishedAt', 'asc'),
    limit(3),
  )
}

// ─── Sermons (latest, featured, by series) ────────────────────────────────────

/** Latest published sermons, paginated. */
export async function fetchLatestSermons(pageLimit: number = PAGINATION.sermons): Promise<VideoDocument[]> {
  return queryDocuments<VideoDocument>(
    VIDEOS_COLLECTION,
    where('contentType', '==', 'sermon'),
    orderBy('publishedAt', 'desc'),
    limit(pageLimit),
  )
}

/** Latest sermon for Home: Firestore first, then the real channel fallback. */
export async function fetchLatestSermonWithFallback(): Promise<VideoDocument | null> {
  try {
    const synced = await fetchLatestSermons(1)
    if (synced[0]) return synced[0]
  } catch (error) {
    console.warn('[Videos] Synced sermon query failed', error)
  }

  return fetchLatestSermonFallback()
}

/** Featured sermon (single). */
export async function fetchFeaturedVideo(): Promise<VideoDocument | null> {
  const results = await queryDocuments<VideoDocument>(
    VIDEOS_COLLECTION,
    where('featured', '==', true),
    where('contentType', '==', 'sermon'),
    orderBy('publishedAt', 'desc'),
    limit(1),
  )
  return results[0] ?? null
}

/** Fetch a single video by Firestore document ID (= youtubeVideoId). */
export async function fetchVideo(id: string): Promise<VideoDocument | null> {
  const doc = await getDocument<VideoDocument>(`${VIDEOS_COLLECTION}/${id}`)
  if (!doc) return null
  return { ...doc, id }
}

// ─── Series ───────────────────────────────────────────────────────────────────

/** All series, ordered by latest episode. */
export async function fetchAllSeries(): Promise<SermonSeries[]> {
  return queryDocuments<SermonSeries>(
    SERIES_COLLECTION,
    orderBy('latestEpisodeAt', 'desc'),
    limit(50),
  )
}

/** Single series by slug. */
export async function fetchSeries(slug: string): Promise<SermonSeries | null> {
  const doc = await getDocument<SermonSeries>(`${SERIES_COLLECTION}/${slug}`)
  if (!doc) return null
  return { ...doc, id: slug }
}

/** All episodes of a series, ordered by episode number. */
export async function fetchSeriesEpisodes(seriesSlug: string): Promise<VideoDocument[]> {
  return queryDocuments<VideoDocument>(
    VIDEOS_COLLECTION,
    where('seriesSlug', '==', seriesSlug),
    orderBy('episodeNumber', 'asc'),
  )
}

/** Standalone sermons (have NNN/ prefix but no CAP suffix). */
export async function fetchStandaloneSermons(
  pageLimit = PAGINATION.sermons,
): Promise<VideoDocument[]> {
  return queryDocuments<VideoDocument>(
    VIDEOS_COLLECTION,
    where('contentType', '==', 'sermon'),
    where('seriesSlug', '==', null),
    orderBy('internalOrder', 'desc'),
    limit(pageLimit),
  )
}
