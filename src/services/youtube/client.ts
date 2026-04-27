import type {
  YouTubeChannelListResponse,
  YouTubePlaylistItemsResponse,
  YouTubeVideosListResponse,
  YouTubeSearchListResponse,
  YouTubePlaylistsListResponse,
} from './types'

const BASE_URL = 'https://www.googleapis.com/youtube/v3'
const MAX_RESULTS_PER_PAGE = 50

export class YouTubeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'YouTubeApiError'
  }
}

async function fetchYouTube<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new YouTubeApiError(
      `YouTube API error: ${response.status} ${response.statusText}`,
      response.status,
    )
  }

  return response.json() as Promise<T>
}

// ─── Channel ──────────────────────────────────────────────────────────────────

/**
 * Resolve a channel handle (e.g. @IGLESIAADORACIONCOLOMBIA) to a channelId and
 * its uploads playlist ID.
 */
export async function resolveChannelHandle(
  handle: string,
  apiKey: string,
): Promise<{ channelId: string; uploadsPlaylistId: string }> {
  // Remove leading @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle

  const data = await fetchYouTube<YouTubeChannelListResponse>('channels', {
    part: 'contentDetails',
    forHandle: cleanHandle,
    key: apiKey,
  })

  const channel = data.items?.[0]
  if (!channel) {
    throw new YouTubeApiError(`Channel not found for handle: ${handle}`, 404)
  }

  return {
    channelId: channel.id,
    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
  }
}

// ─── Playlist items ───────────────────────────────────────────────────────────

/**
 * Fetch all video IDs from an uploads playlist, handling pagination.
 * Returns an array of YouTube video IDs.
 */
export async function fetchUploadsPlaylist(
  playlistId: string,
  apiKey: string,
  maxVideos = 200,
): Promise<string[]> {
  const videoIds: string[] = []
  let pageToken: string | undefined

  do {
    const params: Record<string, string> = {
      part: 'snippet',
      playlistId,
      maxResults: String(MAX_RESULTS_PER_PAGE),
      key: apiKey,
    }
    if (pageToken) params.pageToken = pageToken

    const data = await fetchYouTube<YouTubePlaylistItemsResponse>('playlistItems', params)

    for (const item of data.items) {
      if (item.snippet.resourceId.kind === 'youtube#video') {
        videoIds.push(item.snippet.resourceId.videoId)
      }
    }

    pageToken = data.nextPageToken

    if (videoIds.length >= maxVideos) break
  } while (pageToken)

  return videoIds.slice(0, maxVideos)
}

// ─── Video details ────────────────────────────────────────────────────────────

/**
 * Fetch full metadata for up to 50 video IDs at once.
 * The caller is responsible for batching.
 */
export async function fetchVideosBatch(
  videoIds: string[],
  apiKey: string,
): Promise<YouTubeVideosListResponse> {
  return fetchYouTube<YouTubeVideosListResponse>('videos', {
    part: 'snippet,contentDetails,liveStreamingDetails',
    id: videoIds.join(','),
    key: apiKey,
  })
}

// ─── Live / upcoming streams ──────────────────────────────────────────────────

/**
 * Search for active or scheduled live streams in a channel.
 */
export async function fetchLiveStreams(
  channelId: string,
  apiKey: string,
): Promise<YouTubeSearchListResponse> {
  return fetchYouTube<YouTubeSearchListResponse>('search', {
    part: 'snippet',
    channelId,
    eventType: 'live',
    type: 'video',
    key: apiKey,
  })
}

export async function fetchUpcomingStreams(
  channelId: string,
  apiKey: string,
): Promise<YouTubeSearchListResponse> {
  return fetchYouTube<YouTubeSearchListResponse>('search', {
    part: 'snippet',
    channelId,
    eventType: 'upcoming',
    type: 'video',
    key: apiKey,
  })
}

// ─── Playlists ────────────────────────────────────────────────────────────────

/**
 * Fetch all playlists for a channel.
 */
export async function fetchChannelPlaylists(
  channelId: string,
  apiKey: string,
  maxResults = 50,
): Promise<YouTubePlaylistsListResponse> {
  return fetchYouTube<YouTubePlaylistsListResponse>('playlists', {
    part: 'snippet,contentDetails',
    channelId,
    maxResults: String(maxResults),
    key: apiKey,
  })
}

// ─── Best thumbnail ───────────────────────────────────────────────────────────

export function getBestThumbnailUrl(thumbnails: {
  maxres?: { url: string }
  standard?: { url: string }
  high?: { url: string }
  medium?: { url: string }
  default?: { url: string }
}): string {
  return (
    thumbnails.maxres?.url ??
    thumbnails.standard?.url ??
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url ??
    ''
  )
}
