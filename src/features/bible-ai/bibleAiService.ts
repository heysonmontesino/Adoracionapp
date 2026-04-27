import type { BibleAiRequest, BibleAiInsight } from './types'
import { getMockContextInsight, getMockOriginalLanguageInsight } from './mockBibleAiService'

/**
 * Bible AI Service (Frontend)
 * 
 * This service provides AI-powered insights for Bible verses.
 * 
 * Mode selection:
 * - USE_BACKEND = false (default): Uses local mock data (development only)
 * - USE_BACKEND = true: Calls backend endpoint /v1/bible-ai/insight
 * 
 * Production behavior:
 * - Backend uses real AI provider (Gemini/OpenRouter)
 * - No mock fallback in production if backend fails
 * - User sees controlled error message on failure
 * 
 * Backend URLs:
 * - Local simulator: http://localhost:3000
 * - Physical device: http://TU_IP_LOCAL:3000
 * - TestFlight/producción: URL pública HTTPS
 * 
 * To enable backend mode:
 * 1. Deploy server/bible-ai backend (see server/youtube-proxy.ts)
 * 2. Add to .env:
 *    EXPO_PUBLIC_USE_BACKEND_BIBLE_AI=true
 *    EXPO_PUBLIC_BACKEND_URL=https://tu-backend.com
 * 
 * Note:
 * - EXPO_PUBLIC_USE_BACKEND_BIBLE_AI does NOT contain secrets.
 * - EXPO_PUBLIC_BACKEND_URL does NOT contain secrets.
 * - Real API keys (Gemini/OpenRouter) live ONLY in the backend.
 */

// Configuration
// Set EXPO_PUBLIC_USE_BACKEND_BIBLE_AI=true in .env to enable backend calls
const USE_BACKEND = process.env.EXPO_PUBLIC_USE_BACKEND_BIBLE_AI === 'true'
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000'
const BACKEND_TIMEOUT_MS = 12000 // 12 seconds

async function fetchFromBackend(request: BibleAiRequest): Promise<BibleAiInsight> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS)

  try {
    const response = await fetch(`${BACKEND_URL}/v1/bible-ai/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || 'Backend request failed')
    }

    const data = await response.json()
    return data as BibleAiInsight
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Bible AI backend timeout')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export function generateCacheKey(request: BibleAiRequest): string {
  return `bible-ai:${request.insightType}:${request.book}:${request.chapter}:${request.verseStart}`
}

export async function getBibleAiInsight(request: BibleAiRequest): Promise<BibleAiInsight> {
  if (USE_BACKEND) {
    try {
      return await fetchFromBackend(request)
    } catch (error) {
      // En producción, no silenciar fallos con mock.
      // El usuario verá el error controlado del catch externo.
      if (__DEV__) {
        console.error('[BibleAI] Backend call failed, falling back to local mock', error)
      } else {
        throw error
      }
    }
  }

  // Local mock mode (default)
  if (request.insightType === 'context') {
    return getMockContextInsight(request)
  }

  return getMockOriginalLanguageInsight(request)
}
