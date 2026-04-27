import { FirestoreTimestampValue } from '../../../shared/types/firestore'

// ─── Content classification ───────────────────────────────────────────────────

export type ContentType = 'sermon' | 'worship' | 'live' | 'upcoming' | 'misc'

export type SyncStatus = 'synced' | 'pending' | 'error'

// ─── Main video document (youtube_videos collection) ─────────────────────────

export interface VideoDocument {
  id: string
  youtubeVideoId: string
  title: string
  /** Raw title as it came from YouTube, preserved for re-classification if logic changes */
  rawTitle: string
  description: string
  publishedAt: FirestoreTimestampValue
  thumbnailUrl: string
  videoUrl: string
  /** Duration in ISO 8601 format (e.g. PT45M30S) or formatted string */
  duration: string
  contentType: ContentType
  isLive: boolean
  isUpcoming: boolean
  /** Series slug if this video belongs to a series, null if standalone */
  seriesSlug: string | null
  /** Human-readable series name */
  seriesName: string | null
  /** Episode number within the series (1-based) */
  episodeNumber: number | null
  /** Internal channel order number extracted from the NNN/ prefix in the title */
  internalOrder: number | null
  preacherName: string | null
  sourceChannelHandle: string
  sourceChannelId: string
  tags: string[]
  featured: boolean
  syncStatus: SyncStatus
  syncedAt: FirestoreTimestampValue
}

// ─── Series document (sermon_series collection) ───────────────────────────────

export interface SermonSeries {
  id: string
  slug: string
  name: string
  description: string | null
  thumbnailUrl: string | null
  episodeCount: number
  latestEpisodeAt: FirestoreTimestampValue | null
  createdAt: FirestoreTimestampValue
}

// ─── Parsed title result ──────────────────────────────────────────────────────

export interface ParsedTitle {
  internalOrder: number | null
  cleanTitle: string
  seriesName: string | null
  episodeNumber: number | null
  /** True when the NNN/ prefix exists but no CAP suffix → standalone sermon */
  isStandalone: boolean
}
