// ─── Raw YouTube Data API v3 response types ───────────────────────────────────
// Only the fields we actually consume are typed; the rest is left as unknown.

export interface YouTubeThumbnail {
  url: string
  width?: number
  height?: number
}

export interface YouTubeThumbnails {
  default?: YouTubeThumbnail
  medium?: YouTubeThumbnail
  high?: YouTubeThumbnail
  standard?: YouTubeThumbnail
  maxres?: YouTubeThumbnail
}

// channels.list response
export interface YouTubeChannelItem {
  id: string
  contentDetails: {
    relatedPlaylists: {
      uploads: string
    }
  }
}

export interface YouTubeChannelListResponse {
  items: YouTubeChannelItem[]
}

// playlistItems.list response
export interface YouTubePlaylistItemSnippet {
  publishedAt: string
  title: string
  description: string
  thumbnails: YouTubeThumbnails
  resourceId: {
    kind: string
    videoId: string
  }
  channelId: string
}

export interface YouTubePlaylistItem {
  id: string
  snippet: YouTubePlaylistItemSnippet
}

export interface YouTubePlaylistItemsResponse {
  nextPageToken?: string
  items: YouTubePlaylistItem[]
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

// videos.list response
export type YouTubeLiveBroadcastContent = 'live' | 'upcoming' | 'none'

export interface YouTubeVideoSnippet {
  publishedAt: string
  channelId: string
  title: string
  description: string
  thumbnails: YouTubeThumbnails
  tags?: string[]
  liveBroadcastContent: YouTubeLiveBroadcastContent
}

export interface YouTubeVideoContentDetails {
  duration: string // ISO 8601, e.g. PT45M30S
}

export interface YouTubeLiveStreamingDetails {
  actualStartTime?: string
  actualEndTime?: string
  scheduledStartTime?: string
  scheduledEndTime?: string
  concurrentViewers?: string
}

export interface YouTubeVideoItem {
  id: string
  snippet: YouTubeVideoSnippet
  contentDetails: YouTubeVideoContentDetails
  liveStreamingDetails?: YouTubeLiveStreamingDetails
}

export interface YouTubeVideosListResponse {
  items: YouTubeVideoItem[]
}

// search.list response (used for live detection)
export interface YouTubeSearchSnippet {
  title: string
  description: string
  thumbnails: YouTubeThumbnails
  liveBroadcastContent: YouTubeLiveBroadcastContent
  publishedAt: string
  channelId: string
}

export interface YouTubeSearchResultItem {
  id: {
    kind: string
    videoId: string
  }
  snippet: YouTubeSearchSnippet
}

export interface YouTubeSearchListResponse {
  items: YouTubeSearchResultItem[]
}

// ─── Playlists list response ─────────────────────────────────────────────────

export interface YouTubePlaylistSnippet {
  publishedAt: string
  channelId: string
  title: string
  description: string
  thumbnails: YouTubeThumbnails
  channelTitle: string
}

export interface YouTubePlaylistContentDetails {
  itemCount: number
}

export interface YouTubePlaylist {
  id: string
  snippet: YouTubePlaylistSnippet
  contentDetails: YouTubePlaylistContentDetails
}

export interface YouTubePlaylistsListResponse {
  kind: string
  etag: string
  nextPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
  items: YouTubePlaylist[]
}
