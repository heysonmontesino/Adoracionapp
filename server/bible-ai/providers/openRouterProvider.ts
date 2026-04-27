import type { BibleAiRequest, BibleAiInsight } from '../types'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_TIMEOUT_MS = 30000 // 30 seconds
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-exp:free'

export class ProviderError extends Error {
  constructor(
    message: string,
    public code: 'missing_key' | 'timeout' | 'rate_limit' | 'auth_error' | 'parse_error' | 'provider_error'
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

function buildSystemPrompt(insightType: string): string {
  if (insightType === 'context') {
    return `Eres un asistente bíblico cristiano que ayuda a creyentes a comprender las Escrituras con profundidad y prudencia. Responde SIEMPRE en español. Sé breve y claro (máximo 2-3 oraciones por sección). Mantén tono pastoral, respetuoso y accesible. No presentes doctrinas controversiales como absolutas. No sustituyas el acompañamiento pastoral profesional. Responde SOLO con JSON válido, sin texto adicional.`
  }
  return `Eres un asistente bíblico cristiano que ayuda a creyentes a comprender las Escrituras en sus idiomas originales con prudencia. Responde SIEMPRE en español. Sé breve y claro (máximo 2-3 oraciones por sección). Mantén tono pastoral, respetuoso y accesible. No presentes interpretaciones dudosas como hechos. Reconoce cuando hay debate académico legítimo. Responde SOLO con JSON válido, sin texto adicional.`
}

function buildUserMessage(request: BibleAiRequest): string {
  const reference = `${request.book} ${request.chapter}:${request.verseStart}${request.verseEnd ? `-${request.verseEnd}` : ''}`

  if (request.insightType === 'context') {
    return `Referencia: ${reference}
Versículo: "${request.verseText}"
${request.surroundingText ? `Contexto cercano:\n${request.surroundingText}\n\n` : ''}
Versión bíblica: ${request.bibleVersion || 'RVR1960'}

Proporciona un análisis devocional y contextual con estas secciones:
1. "Resumen del pasaje"
2. "Contexto histórico"
3. "Contexto cultural"
4. "Contexto espiritual"
5. "Aplicación para hoy"

Responde con este JSON exacto:
{
  "title": "Contexto del pasaje",
  "subtitle": "${reference}",
  "type": "context",
  "sections": [
    { "title": "Resumen del pasaje", "body": "..." },
    { "title": "Contexto histórico", "body": "..." },
    { "title": "Contexto cultural", "body": "..." },
    { "title": "Contexto espiritual", "body": "..." },
    { "title": "Aplicación para hoy", "body": "..." }
  ],
  "disclaimer": "Esta explicación es una ayuda devocional y contextual. No reemplaza el acompañamiento pastoral ni el estudio bíblico profundo."
}`
  }

  return `Referencia: ${reference}
Versículo: "${request.verseText}"
Versión bíblica: ${request.bibleVersion || 'RVR1960'}

Proporciona un análisis del idioma original con estas secciones:
1. "Idioma original"
2. "Palabras clave"
3. "Matiz que puede perderse en español"
4. "Aplicación del matiz al pasaje"

Responde con este JSON exacto:
{
  "title": "Texto en idioma original",
  "subtitle": "${reference}",
  "type": "original_language",
  "sections": [
    { "title": "Idioma original", "body": "..." },
    { "title": "Palabras clave", "body": "..." },
    { "title": "Matiz que puede perderse en español", "body": "..." },
    { "title": "Aplicación del matiz al pasaje", "body": "..." }
  ],
  "disclaimer": "Los matices del idioma original deben leerse con prudencia, usando fuentes bíblicas confiables y considerando el contexto completo del pasaje."
}`
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new ProviderError('El proveedor de IA tardó demasiado en responder', 'timeout')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function generateOpenRouterInsight(request: BibleAiRequest): Promise<BibleAiInsight> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new ProviderError('Proveedor de IA no configurado', 'missing_key')
  }

  const response = await fetchWithTimeout(
    OPENROUTER_API_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://adoracion-app.web.app',
        'X-Title': 'AdoracionApp Bible AI',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(request.insightType) },
          { role: 'user', content: buildUserMessage(request) },
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    },
    OPENROUTER_TIMEOUT_MS
  )

  if (!response.ok) {
    const status = response.status
    if (status === 401 || status === 403) {
      throw new ProviderError('Error de autenticación con el proveedor de IA', 'auth_error')
    }
    if (status === 429) {
      throw new ProviderError('Demasiadas solicitudes al proveedor de IA. Intenta más tarde.', 'rate_limit')
    }
    const errorBody = await response.text().catch(() => 'Unknown error')
    console.error('[OpenRouter] API error:', status, errorBody.substring(0, 200))
    throw new ProviderError('El proveedor de IA no pudo procesar la solicitud', 'provider_error')
  }

  const data = await response.json()

  const text = data.choices?.[0]?.message?.content
  if (!text) {
    throw new ProviderError('La respuesta del proveedor de IA no contiene contenido válido', 'parse_error')
  }

  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(cleaned) as BibleAiInsight

    if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new ProviderError('La respuesta del proveedor no tiene el formato esperado', 'parse_error')
    }

    return parsed
  } catch (error: any) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('No se pudo interpretar la respuesta del proveedor de IA', 'parse_error')
  }
}
