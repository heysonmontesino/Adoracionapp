import type { BibleAiRequest, BibleAiInsight } from '../types'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const GEMINI_TIMEOUT_MS = 30000 // 30 seconds

export class ProviderError extends Error {
  constructor(
    message: string,
    public code: 'missing_key' | 'timeout' | 'rate_limit' | 'auth_error' | 'parse_error' | 'provider_error'
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

function buildPrompt(request: BibleAiRequest): string {
  const reference = `${request.book} ${request.chapter}:${request.verseStart}${request.verseEnd ? `-${request.verseEnd}` : ''}`

  if (request.insightType === 'context') {
    return `Eres un asistente bíblico cristiano que ayuda a creyentes a comprender las Escrituras con profundidad y prudencia.

Referencia: ${reference}
Versículo: "${request.verseText}"
${request.surroundingText ? `Contexto cercano:\n${request.surroundingText}\n\n` : ''}
Versión bíblica: ${request.bibleVersion || 'RVR1960'}

Proporciona un análisis devocional y contextual en español con estas secciones exactas:
1. "Resumen del pasaje" — Breve explicación del mensaje central
2. "Contexto histórico" — Situación histórica del autor y audiencia original
3. "Contexto cultural" — Costumbres o prácticas relevantes de la época
4. "Contexto espiritual" — Significado teológico y relación con el mensaje bíblico general
5. "Aplicación para hoy" — Cómo este pasaje puede guiar la vida diaria del creyente

Reglas estrictas:
- Responde SIEMPRE en español
- Sé breve y claro (máximo 2-3 oraciones por sección)
- Mantén tono pastoral, respetuoso y accesible
- No presentes doctrinas controversiales como absolutas
- No sustituyas el acompañamiento pastoral profesional
- Si el pasaje es complejo, reconoce la complejidad con humildad

Formato de respuesta: JSON válido con esta estructura exacta:
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
}

Devuelve SOLO el JSON, sin texto adicional antes ni después.`
  }

  return `Eres un asistente bíblico cristiano que ayuda a creyentes a comprender las Escrituras en sus idiomas originales con prudencia.

Referencia: ${reference}
Versículo: "${request.verseText}"
Versión bíblica: ${request.bibleVersion || 'RVR1960'}

Proporciona un análisis del idioma original en español con estas secciones exactas:
1. "Idioma original" — Hebreo/arameo para AT, griego koiné para NT
2. "Palabras clave" — 1-3 palabras importantes del versículo con su significado original
3. "Matiz que puede perderse en español" — Distinción semántica o gramatical relevante
4. "Aplicación del matiz al pasaje" — Cómo este matiz enriquece la comprensión

Reglas estrictas:
- Responde SIEMPRE en español
- Sé breve y claro (máximo 2-3 oraciones por sección)
- Mantén tono pastoral, respetuoso y accesible
- No presentes interpretaciones dudosas como hechos
- Reconoce cuando hay debate académico legítimo
- Usa caracteres hebreos y griegos reales cuando sea posible

Formato de respuesta: JSON válido con esta estructura exacta:
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
}

Devuelve SOLO el JSON, sin texto adicional antes ni después.`
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

export async function generateGeminiInsight(request: BibleAiRequest): Promise<BibleAiInsight> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new ProviderError('Proveedor de IA no configurado', 'missing_key')
  }

  const prompt = buildPrompt(request)

  const response = await fetchWithTimeout(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1500,
          responseMimeType: 'application/json',
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    },
    GEMINI_TIMEOUT_MS
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
    console.error('[Gemini] API error:', status, errorBody.substring(0, 200))
    throw new ProviderError('El proveedor de IA no pudo procesar la solicitud', 'provider_error')
  }

  const data = await response.json()

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
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
