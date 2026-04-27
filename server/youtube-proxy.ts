import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { generateBibleAiInsight } from './bible-ai/generateBibleAiInsight';

const app = express();

// Trust proxy for rate limiting behind load balancers
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// Parse JSON bodies with size limit
app.use(express.json({ limit: '32kb' }));

// --- Security: Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply limiter to all v1 routes
app.use('/v1/', limiter);

// Bible AI specific rate limiter (more conservative)
const bibleAiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 AI requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has usado varias explicaciones con IA en poco tiempo. Intenta nuevamente más tarde.',
  },
});

// --- Security: CORS Origin Filtering ---
const allowedOrigins = [
  'http://localhost:19006',
  'http://localhost:8081',
  'https://adoracion-app.web.app',
  'https://adoracion-app.firebaseapp.com',
];

app.use(cors({
  origin: (origin, callback) => {
    // Mobile apps often don't send an Origin header. 
    // In production, we might want to be stricter, but for now we allow missing origins.
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('No permitido por la política de seguridad (CORS)'));
    }
  }
}));

// Health check endpoint (for deploy platforms like Render, Railway)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

/**
 * YouTube Proxy Backend v1
 * Implementation for Adoración App
 */

// Configuration
const API_KEY = process.env.YOUTUBE_API_KEY || '';
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || '';
const MOCK_MODE = process.env.YOUTUBE_MOCK_MODE === 'true' && process.env.NODE_ENV !== 'production';

// Cache Store
let cache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 300 * 1000; // 5 minutes

const MOCK_DATA = {
  live: {
    status: "upcoming",
    video: {
      id: "mock_live_123",
      title: "[MOCK] Servicio de Adoración Especial",
      thumbnail: "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=500",
      scheduledStartTime: new Date(Date.now() + 3600000).toISOString()
    }
  },
  latest: [
    {
      id: "mock_vid_1",
      title: "[MOCK] El Poder de la Oración",
      thumbnail: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=500",
      publishedAt: new Date().toISOString()
    },
    {
      id: "mock_vid_2",
      title: "[MOCK] Domingo de Gloria",
      thumbnail: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=500",
      publishedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  series: [
    {
      id: "mock_playlist_1",
      title: "[MOCK] Serie: Fundamentos",
      thumbnail: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?q=80&w=500",
      count: 12
    }
  ],
  updatedAt: new Date().toISOString()
};

async function fetchFromYouTube(endpoint: string, params: Record<string, string>) {
  if (!API_KEY) throw new Error('YouTube API Key missing');
  
  const urlParams = new URLSearchParams({ ...params, key: API_KEY });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${urlParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube API Error: ${JSON.stringify(error)}`);
  }
  return response.json();
}

app.get('/v1/content/feed', async (req, res) => {
  try {
    // 1. Mock Mode Bypass (Strictly non-production)
    if (MOCK_MODE) {
      console.log('Serving MOCK_DATA');
      return res.json({ ...MOCK_DATA, updatedAt: new Date().toISOString() });
    }

    // 2. Check Cache
    if (cache && (Date.now() - cache.timestamp < CACHE_TTL)) {
      return res.json(cache.data);
    }

    if (!API_KEY || !CHANNEL_ID) {
      return res.status(500).json({ 
        error: 'Configuración de YouTube incompleta.',
        hint: 'Define YOUTUBE_API_KEY y YOUTUBE_CHANNEL_ID'
      });
    }

    // 3. Fetch Data in Parallel
    const [liveResponse, uploadsResponse, playlistsResponse] = await Promise.all([
      fetchFromYouTube('search', {
        part: 'snippet',
        channelId: CHANNEL_ID,
        type: 'video',
        eventType: 'live',
        maxResults: '1'
      }).catch(() => ({ items: [] })),
      fetchFromYouTube('channels', {
        part: 'contentDetails',
        id: CHANNEL_ID
      }).then(data => {
        const uploadsId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsId) return { items: [] };
        return fetchFromYouTube('playlistItems', {
          part: 'snippet',
          playlistId: uploadsId,
          maxResults: '10'
        });
      }),
      fetchFromYouTube('playlists', {
        part: 'snippet,contentDetails',
        channelId: CHANNEL_ID,
        maxResults: '10'
      })
    ]);

    // 4. Resolve "Upcoming" if no active Live
    let liveStatus: 'live' | 'upcoming' | 'none' = 'none';
    let liveVideo = null;

    if (liveResponse.items?.length > 0) {
      liveStatus = 'live';
      const item = liveResponse.items[0];
      liveVideo = {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        scheduledStartTime: null
      };
    } else {
      const upcomingResponse = await fetchFromYouTube('search', {
        part: 'snippet',
        channelId: CHANNEL_ID,
        type: 'video',
        eventType: 'upcoming',
        maxResults: '1'
      }).catch(() => ({ items: [] }));

      if (upcomingResponse.items?.length > 0) {
        liveStatus = 'upcoming';
        const item = upcomingResponse.items[0];
        liveVideo = {
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          scheduledStartTime: item.snippet.publishedAt
        };
      }
    }

    // 5. Normalize Data
    const feed = {
      live: { status: liveStatus, video: liveVideo },
      latest: (uploadsResponse.items || []).map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt
      })),
      series: (playlistsResponse.items || []).map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        count: item.contentDetails.itemCount
      })),
      updatedAt: new Date().toISOString()
    };

    // 6. Update Cache
    cache = { data: feed, timestamp: Date.now() };
    res.json(feed);
  } catch (error: any) {
    console.error('Feed error:', error);
    // Secure degradation: No mock fallback here
    res.status(500).json({ 
      error: 'Error al obtener el feed de contenido.',
      message: 'Inténtalo de nuevo más tarde.'
    });
  }
});

/**
 * Bible AI Insight Endpoint
 * POST /v1/bible-ai/insight
 * 
 * Generates contextual or original language insights for Bible verses.
 * Uses in-memory cache (upgradeable to Firestore when firebase-admin is installed).
 * Currently returns mock data; ready for Gemini/OpenRouter integration.
 */
app.post('/v1/bible-ai/insight', bibleAiLimiter, async (req, res) => {
  try {
    const response = await generateBibleAiInsight(req.body)
    res.json(response)
  } catch (error: any) {
    if (error.status === 400) {
      return res.status(400).json({
        error: 'Solicitud inválida',
        message: error.message,
      })
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Demasiadas solicitudes',
        message: error.message || 'Has excedido el límite de uso. Intenta más tarde.',
      })
    }

    if (error.status === 502) {
      return res.status(502).json({
        error: 'Error de procesamiento',
        message: error.message || 'No pudimos procesar la respuesta del servicio de IA.',
      })
    }

    if (error.status === 503) {
      return res.status(503).json({
        error: 'Servicio no disponible',
        message: error.message || 'El servicio de IA no está disponible en este momento.',
      })
    }

    if (error.status === 504) {
      return res.status(504).json({
        error: 'Tiempo de espera agotado',
        message: error.message || 'El servicio de IA tardó demasiado. Intenta de nuevo.',
      })
    }

    console.error('[BibleAI] Unexpected error:', error.message)
    res.status(500).json({
      error: 'Error al generar explicación',
      message: 'No pudimos procesar tu solicitud en este momento. Intenta de nuevo.',
    })
  }
})

// Handle payload too large errors cleanly (no stack trace exposure)
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      error: 'Solicitud demasiado grande',
      message: 'El cuerpo de la solicitud excede el tamaño máximo permitido.',
    })
  }
  console.error('[Server] Unhandled error:', err.message)
  res.status(500).json({
    error: 'Error interno del servidor',
    message: 'Algo salió mal. Intenta de nuevo más tarde.',
  })
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Adoración App Backend v1 running on port ${PORT}`);
  if (MOCK_MODE) console.log('MOCK_MODE is ENABLED (Local Development Only)');
});

