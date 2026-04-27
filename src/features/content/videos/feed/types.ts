export type FeedVideo = {
  id: string
  title: string
  thumbnail: string
  publishedAt?: string
  scheduledStartTime?: string | null
  /** Full YouTube URL override. When present, `openYouTubeURL` uses this instead of constructing from `id`. */
  url?: string
}

export type FeedLive = {
  status: 'live' | 'upcoming' | 'none'
  video: FeedVideo | null
}

export type FeedSeries = {
  id: string
  title: string
  thumbnail: string
  count: number
  playlistId?: string  // YouTube playlist ID (PLxxxxxxxx). Opcional — si falta, fallback a búsqueda por título.
}

export type ContentFeed = {
  live: FeedLive
  latest: FeedVideo[]
  series: FeedSeries[]
  updatedAt: string
}
