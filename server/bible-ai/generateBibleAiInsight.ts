import type { BibleAiRequest, BibleAiResponse } from './types'
import { validateBibleAiRequest, ValidationError } from './validation'
import { generateCacheKey, getCachedInsight, cacheInsight } from './cache'
import { generateGeminiInsight, ProviderError as GeminiProviderError } from './providers/geminiProvider'
import { generateOpenRouterInsight, ProviderError as OpenRouterProviderError } from './providers/openRouterProvider'
import { generateMockContextInsight, generateMockOriginalLanguageInsight } from './mockProvider'

type ProviderName = 'gemini' | 'openrouter' | 'mock'

function getProviderName(): ProviderName {
  const configured = (process.env.BIBLE_AI_PROVIDER || 'gemini').toLowerCase() as ProviderName
  const valid: ProviderName[] = ['gemini', 'openrouter', 'mock']
  if (!valid.includes(configured)) return 'gemini'
  return configured
}

function isMockAllowed(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.ALLOW_PRODUCTION_MOCK === 'true'
}

export async function generateBibleAiInsight(rawRequest: any): Promise<BibleAiResponse> {
  // Step 1: Validate request
  let request: BibleAiRequest
  try {
    request = validateBibleAiRequest(rawRequest)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw { status: 400, message: error.message }
    }
    throw { status: 500, message: 'Validation error' }
  }

  // Step 2: Generate cache key
  const cacheKey = generateCacheKey(request)

  // Step 3: Check cache
  const cached = await getCachedInsight(cacheKey)
  if (cached) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[BibleAI] Cache hit:', cacheKey)
    }
    return {
      ...cached,
      source: 'cache',
      cachedAt: new Date().toISOString(),
    }
  }

  // Step 4: Select and run provider
  const providerName = getProviderName()

  if (providerName === 'mock') {
    if (!isMockAllowed()) {
      throw {
        status: 503,
        message: 'El servicio de IA no está disponible en este momento',
      }
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[BibleAI] Using mock provider for:', cacheKey)
    }
    const insight = request.insightType === 'context'
      ? await generateMockContextInsight(request)
      : await generateMockOriginalLanguageInsight(request)
    await cacheInsight(cacheKey, insight)
    return { ...insight, source: 'generated_mock', generatedAt: new Date().toISOString() }
  }

  // Step 5: Run real AI provider
  try {
    let insight
    if (providerName === 'gemini') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[BibleAI] Calling Gemini provider for:', cacheKey)
      }
      insight = await generateGeminiInsight(request)
    } else if (providerName === 'openrouter') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[BibleAI] Calling OpenRouter provider for:', cacheKey)
      }
      insight = await generateOpenRouterInsight(request)
    } else {
      throw { status: 500, message: 'Proveedor de IA no reconocido' }
    }

    await cacheInsight(cacheKey, insight)
    return { ...insight, source: 'generated_ai', generatedAt: new Date().toISOString() }
  } catch (error: any) {
    if (error.status) throw error // Already formatted error from provider

    if (error instanceof GeminiProviderError || error instanceof OpenRouterProviderError) {
      if (error.code === 'missing_key') {
        throw { status: 503, message: 'El servicio de IA no está configurado' }
      }
      if (error.code === 'timeout') {
        throw { status: 504, message: 'El servicio de IA tardó demasiado. Intenta de nuevo.' }
      }
      if (error.code === 'rate_limit') {
        throw { status: 429, message: error.message }
      }
      if (error.code === 'auth_error') {
        console.error('[BibleAI] Provider auth error:', error.message)
        throw { status: 503, message: 'El servicio de IA no está disponible temporalmente' }
      }
      if (error.code === 'parse_error') {
        console.error('[BibleAI] Provider parse error:', error.message)
        throw { status: 502, message: 'No pudimos procesar la respuesta del servicio de IA' }
      }
    }

    console.error('[BibleAI] Provider error:', error.message)
    throw { status: 503, message: 'El servicio de IA no está disponible en este momento' }
  }
}
