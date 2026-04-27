import { Config } from '../../../../shared/constants/config'
import { CHURCH_YOUTUBE } from '../../../../shared/constants/church'
import { ContentFeed, FeedVideo, FeedSeries } from './types'
import { 
  fetchChannelPlaylists, 
  fetchLiveStreams, 
  fetchUpcomingStreams, 
  fetchVideosBatch, 
  fetchUploadsPlaylist,
  getBestThumbnailUrl 
} from '../../../../services/youtube/client'

// ─── Mock Feed — Iglesia Adoración Colombia ───────────────────────────────────
// En modo DEMO todos los toques abren el canal real de la iglesia.
// Cuando el proxy de YouTube esté conectado, `latest` y `series` llegarán
// con IDs y playlistIds reales del canal @IGLESIAADORACIONCOLOMBIA.
const MOCK_FEED: ContentFeed = {
  live: {
    status: 'upcoming',
    video: {
      id: 'live-adoracion',
      title: 'Servicio de Adoración en Vivo',
      thumbnail: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=800',
      scheduledStartTime: new Date(Date.now() + 7200000).toISOString(),
      url: CHURCH_YOUTUBE.liveUrl,
    },
  },
  latest: [
    {
      id: 'latest-1',
      title: 'Última Prédica — Iglesia Adoración Colombia',
      thumbnail: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=500',
      url: CHURCH_YOUTUBE.videosUrl,
    },
    {
      id: 'latest-2',
      title: 'Prédica Reciente',
      thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=500',
      url: CHURCH_YOUTUBE.videosUrl,
    },
    {
      id: 'latest-3',
      title: 'Ver Todas las Prédicas',
      thumbnail: 'https://images.unsplash.com/photo-1455849318743-b2233052fcff?q=80&w=500',
      url: CHURCH_YOUTUBE.videosUrl,
    },
  ],
  series: [
    {
      id: 's1',
      title: 'Series — Iglesia Adoración Colombia',
      thumbnail: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=500',
      count: 0,
      // Reemplazar con el playlist ID real cuando esté disponible
    },
    {
      id: 's2',
      title: 'Ver Todas las Series',
      thumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=500',
      count: 0,
    },
  ],
  updatedAt: new Date().toISOString(),
}

const EMPTY_FEED: ContentFeed = {
  live: { status: 'none', video: null },
  latest: [],
  series: [],
  updatedAt: new Date().toISOString(),
}

// Acceso dinámico a variables de entorno para evitar problemas de hoisting/caching.
const getYouTubeConfig = () => ({
  apiKey: process.env.EXPO_PUBLIC_YOUTUBE_API_KEY,
  channelId: (process.env.EXPO_PUBLIC_YOUTUBE_CHANNEL_ID || CHURCH_YOUTUBE.channelId).trim()
})

/**
 * Fallback to YouTube Data API directly when the central API is not available.
 * This ensures the app is robust and can function without a backend.
 */
async function fetchFeedFromYouTube(): Promise<ContentFeed> {
  const { apiKey, channelId } = getYouTubeConfig()

  console.log('[YouTube Feed] Intentando fetch real...', { 
    hasKey: !!apiKey, 
    channelId 
  })

  if (!apiKey) {
    console.error('[YouTube Feed] ERROR: EXPO_PUBLIC_YOUTUBE_API_KEY no detectada.')
    return __DEV__ ? MOCK_FEED : EMPTY_FEED
  }

  try {
    // 1. Playlists (Series)
    let series: FeedSeries[] = []
    try {
      console.log('[YouTube Feed] Solicitando playlists...')
      const playlistsData = await fetchChannelPlaylists(channelId, apiKey)
      series = (playlistsData.items || [])
        .filter(p => p.contentDetails?.itemCount > 0)
        .sort((a, b) => new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime())
        .map(p => ({
          id: p.id,
          title: p.snippet.title,
          thumbnail: getBestThumbnailUrl(p.snippet.thumbnails),
          count: p.contentDetails.itemCount,
          playlistId: p.id
        }))
      console.log('[DEBUG-YouTube] Playlists cargadas:', series.length)
    } catch (e: any) {
      console.log('[DEBUG-YouTube] Error en Playlists:', e.message)
    }

    // 2. Live / Upcoming
    let liveStatus: 'live' | 'upcoming' | 'none' = 'none'
    let liveVideo: FeedVideo | null = null

    try {
      console.log('[DEBUG-YouTube] Buscando en vivo...')
      const liveData = await fetchLiveStreams(channelId, apiKey)
      if (liveData.items && liveData.items.length > 0) {
        const item = liveData.items[0]
        liveStatus = 'live'
        liveVideo = {
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: getBestThumbnailUrl(item.snippet.thumbnails),
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        }
      } else {
        console.log('[DEBUG-YouTube] Sin en vivo, buscando próximos...')
        const upcomingData = await fetchUpcomingStreams(channelId, apiKey)
        if (upcomingData.items && upcomingData.items.length > 0) {
          const item = upcomingData.items[0]
          liveStatus = 'upcoming'
          
          let scheduledStartTime: string | null = null
          try {
            const detail = await fetchVideosBatch([item.id.videoId], apiKey)
            const liveDetails = detail.items[0]?.liveStreamingDetails
            if (liveDetails?.scheduledStartTime) {
              scheduledStartTime = liveDetails.scheduledStartTime
            }
          } catch (e) {
            console.log('[DEBUG-YouTube] No se pudo obtener hora exacta de inicio')
          }

          liveVideo = {
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: getBestThumbnailUrl(item.snippet.thumbnails),
            scheduledStartTime,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
          }
        }
      }
    } catch (e: any) {
      console.log('[DEBUG-YouTube] Error en Live/Upcoming:', e.message)
    }

    // 3. Latest Videos (Uploads)
    let latest: FeedVideo[] = MOCK_FEED.latest
    try {
      console.log('[DEBUG-YouTube] Solicitando últimas prédicas...')
      const uploadsPlaylistId = channelId.startsWith('UC') ? channelId.replace('UC', 'UU') : channelId
      const uploads = await fetchUploadsPlaylist(uploadsPlaylistId, apiKey, 6)
      if (uploads && uploads.length > 0) {
        const videosData = await fetchVideosBatch(uploads, apiKey)
        latest = (videosData.items || []).map(v => ({
          id: v.id,
          title: v.snippet.title,
          thumbnail: getBestThumbnailUrl(v.snippet.thumbnails),
          publishedAt: v.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${v.id}`
        }))
      }
    } catch (e: any) {
      console.log('[DEBUG-YouTube] Error en Latest Videos:', e.message)
    }

    // Si todo falló y no tenemos ni series ni live real, devolvemos mock en DEV o vacío en PROD
    if (series.length === 0 && liveStatus === 'none' && latest === MOCK_FEED.latest) {
      console.log('[DEBUG-YouTube] Todo falló o datos vacíos.')
      return __DEV__ ? MOCK_FEED : EMPTY_FEED
    }

    return {
      live: { status: liveStatus, video: liveVideo },
      latest,
      series,
      updatedAt: new Date().toISOString()
    }
  } catch (error: any) {
    console.log('[DEBUG-YouTube] Error crítico consultando API:', error.message)
    return __DEV__ ? MOCK_FEED : EMPTY_FEED
  }
}

const API_BASE_URL = process.env.EXPO_PUBLIC_CONTENT_API_URL


export async function fetchContentFeed(): Promise<ContentFeed> {
  // Si estamos en modo DEMO pero tenemos las llaves de YouTube, priorizamos datos reales 
  // para las series como pidió el usuario, pero si falla algo volvemos al mock.
  
  if (API_BASE_URL && API_BASE_URL.startsWith('http')) {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/content/feed`)
      if (response.ok) return response.json()
    } catch (error) {
      console.warn('Remote API failed, falling back to YouTube/Mocks')
    }
  }

  // Si no hay API o falló, consumimos YouTube directamente
  return fetchFeedFromYouTube()
}
