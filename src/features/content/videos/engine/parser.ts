import type { ContentType, ParsedTitle } from '../types'

// ─── Title parsing ────────────────────────────────────────────────────────────

/**
 * Channel title format: NNN/TITLE - CAP N
 *   NNN  = internal order (3+ digits, zero-padded or not)
 *   TITLE = series name (ALL CAPS)
 *   CAP N = episode number (optional; if absent the video is a standalone sermon)
 *
 * Examples:
 *   "138/EL DIA DE MI RESURRECCIÓN - CAP 1"     → series, ep 1
 *   "137/QUIEN ENTRA HOY EN TU VIDA ?"           → standalone sermon
 *   "135/NO TODO EL QUE TE SIGUE ES TU AMIGO - CAP 02" → series, ep 2
 *   "133/LA VANIDAD DE LA RELIGION - CAP 4"     → series, ep 4
 */
const INTERNAL_TITLE_RE = /^(\d+)\/(.+?)(?:\s*[-–]\s*CAP[.\s]+(\d+))?$/i

export function parseTitle(rawTitle: string): ParsedTitle {
  const trimmed = rawTitle.trim()
  const match = trimmed.match(INTERNAL_TITLE_RE)

  if (!match) {
    return {
      internalOrder: null,
      cleanTitle: trimmed,
      seriesName: null,
      episodeNumber: null,
      isStandalone: false,
    }
  }

  const internalOrder = parseInt(match[1], 10)
  const body = match[2].trim()
  const episodeNumber = match[3] !== undefined ? parseInt(match[3], 10) : null
  const isStandalone = episodeNumber === null

  return {
    internalOrder,
    cleanTitle: body,
    seriesName: isStandalone ? null : body,
    episodeNumber,
    isStandalone,
  }
}

// ─── Convenience accessors (pure, used by sync service) ──────────────────────

export function parseInternalOrder(rawTitle: string): number | null {
  return parseTitle(rawTitle).internalOrder
}

export function parseSeriesFromTitle(rawTitle: string): string | null {
  return parseTitle(rawTitle).seriesName
}

export function parseEpisodeNumber(rawTitle: string): number | null {
  return parseTitle(rawTitle).episodeNumber
}

// ─── Slug generation ──────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function buildSeriesSlug(seriesName: string): string {
  return slugify(seriesName)
}

// ─── Content classification ───────────────────────────────────────────────────

// Note: "adoración" is excluded — it's the church's own name and appears in nearly every title.
const WORSHIP_KEYWORDS_RE =
  /\b(worship|alabanza|m[uú]sica|canto|himno|louvor|praise|bueno\s+es\s+alabarte|santa\s+cena|noche\s+de\s+alabanza)\b/i

/**
 * Classify a YouTube video into one of the ContentType values.
 *
 * Priority order:
 *   1. live      — YouTube liveBroadcastContent is 'live'
 *   2. upcoming  — YouTube liveBroadcastContent is 'upcoming'
 *   3. sermon    — title starts with NNN/
 *   4. worship   — title or description contains worship/music keywords
 *   5. misc      — fallback
 */
export function classifyContentType(params: {
  title: string
  description?: string
  liveBroadcastContent?: 'live' | 'upcoming' | 'none' | null
}): ContentType {
  const { title, description = '', liveBroadcastContent } = params

  if (liveBroadcastContent === 'live') return 'live'
  if (liveBroadcastContent === 'upcoming') return 'upcoming'

  const hasInternalOrder = /^\d{2,}\//.test(title.trim())
  if (hasInternalOrder) return 'sermon'

  if (WORSHIP_KEYWORDS_RE.test(title) || WORSHIP_KEYWORDS_RE.test(description)) return 'worship'

  return 'misc'
}

// ─── Preacher extraction ──────────────────────────────────────────────────────

const PREACHER_PATTERNS = [
  /Pastor\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/,
  /Predicador:\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/i,
  /Pr\.\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/,
]

/**
 * Attempt to extract a preacher name from the video description.
 * Returns null when no recognizable pattern is found.
 */
export function extractPreacherName(description: string): string | null {
  for (const pattern of PREACHER_PATTERNS) {
    const match = description.match(pattern)
    if (match) return match[1].trim()
  }
  return null
}
