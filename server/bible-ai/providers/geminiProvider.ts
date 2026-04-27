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

function normalizeBody(text: string): string {
  let result = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()

  result = result
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^•(\S)/gm, '• $1')

  return result
}

function normalizeInsight(insight: BibleAiInsight): BibleAiInsight {
  return {
    ...insight,
    title: insight.title.replace(/[#*`]/g, '').trim(),
    subtitle: insight.subtitle?.replace(/[#*`]/g, '').trim(),
    disclaimer: insight.disclaimer.replace(/[#*`]/g, '').trim(),
    sections: insight.sections.map(section => ({
      ...section,
      title: section.title.replace(/[#*`]/g, '').trim(),
      body: normalizeBody(section.body),
    })),
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

Reglas estrictas de estilo:
- Responde SIEMPRE en español
- Cada sección: máximo 2 párrafos breves (3-4 oraciones cada uno)
- Español claro, pastoral y fácil de leer en pantalla de celular
- No usar lenguaje excesivamente académico
- No inventar datos históricos si no son seguros
- No presentar interpretaciones doctrinales como absolutas
- Mantener tono devocional y educativo
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

Sección 1 — "Idioma original"
- Indica si el pasaje está en hebreo, arameo o griego koiné.
- Explica en 1 párrafo breve (2-3 oraciones) el contexto del idioma.

Sección 2 — "Palabras clave"
- Elige 2 a 4 palabras importantes del versículo en su idioma original.
- Cada palabra debe aparecer en una línea separada con este formato exacto:
  • palabraOriginal (transliteración): significado breve y claro.
- Ejemplo correcto:
  • שׁוֹפָר (shofar): trompeta o cuerno usado para convocar o alertar.
  • נְצִיב (netsiv): guarnición o puesto militar.
  • וַיַּךְ (vayák): golpeó o atacó.
- NO mezclar las palabras dentro de un párrafo largo. Cada palabra en su propia línea.
- Usar el carácter "•" (bullet) al inicio de cada línea.

Sección 3 — "Matiz que puede perderse en español"
- Explica en 1-2 párrafos breves una distinción semántica o gramatical relevante.
- Si incluyes palabras en hebreo o griego, NO las mezcles dentro de frases largas.
- Preséntalas de forma separada y clara.

Sección 4 — "Aplicación del matiz al pasaje"
- Explica en 1 párrafo breve cómo este matiz enriquece la comprensión del versículo.
- Mantén tono devocional y práctico.

Reglas estrictas de estilo:
- Responde SIEMPRE en español
- Cada sección: máximo 2 párrafos breves
- Español claro, pastoral y fácil de leer en pantalla de celular
- No usar lenguaje excesivamente académico
- No presentar interpretaciones dudosas como hechos
- Reconoce cuando hay debate académico legítimo
- Usa caracteres hebreos y griegos reales cuando sea posible
- Las palabras originales deben aparecer en formato de lista con "•", nunca dentro de párrafos largos
- Evita puntuación desordenada o frases con orden raro
- No inventar significados de palabras; usa léxicos confiables (BDB, BDAG, Strong)

Formato de respuesta: JSON válido con esta estructura exacta:
{
  "title": "Texto en idioma original",
  "subtitle": "${reference}",
  "type": "original_language",
  "sections": [
    { "title": "Idioma original", "body": "..." },
    { "title": "Palabras clave", "body": "• palabra1 (translit1): significado1.\\n• palabra2 (translit2): significado2.\\n• palabra3 (translit3): significado3." },
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

    for (const section of parsed.sections) {
      if (!section.title || typeof section.body !== 'string') {
        throw new ProviderError('Cada sección debe tener title (string) y body (string)', 'parse_error')
      }
    }

    return normalizeInsight(parsed)
  } catch (error: any) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('No se pudo interpretar la respuesta del proveedor de IA', 'parse_error')
  }
}
