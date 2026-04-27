import type { BibleAiRequest } from './types'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

const MAX_VERSE_TEXT_LENGTH = 1500
const MAX_SURROUNDING_TEXT_LENGTH = 6000
const VALID_INSIGHT_TYPES = ['context', 'original_language'] as const
const VALID_LANGUAGES = ['es'] as const

function sanitizeText(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

export function validateBibleAiRequest(data: any): BibleAiRequest {
  // Validate body structure
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Invalid request body structure')
  }

  // book
  if (!data.book || typeof data.book !== 'string' || data.book.trim().length === 0) {
    throw new ValidationError('book is required and must be a non-empty string')
  }

  // chapter
  if (!Number.isInteger(data.chapter) || data.chapter < 1) {
    throw new ValidationError('chapter must be a positive integer')
  }

  // verseStart
  if (!Number.isInteger(data.verseStart) || data.verseStart < 1) {
    throw new ValidationError('verseStart must be a positive integer')
  }

  // verseEnd (optional)
  if (data.verseEnd !== undefined && (!Number.isInteger(data.verseEnd) || data.verseEnd < data.verseStart)) {
    throw new ValidationError('verseEnd must be >= verseStart if provided')
  }

  // verseText
  if (!data.verseText || typeof data.verseText !== 'string' || data.verseText.trim().length === 0) {
    throw new ValidationError('verseText is required and must be a non-empty string')
  }
  if (data.verseText.length > MAX_VERSE_TEXT_LENGTH) {
    throw new ValidationError(`verseText exceeds maximum length of ${MAX_VERSE_TEXT_LENGTH} characters`)
  }

  // surroundingText (optional)
  if (data.surroundingText !== undefined) {
    if (typeof data.surroundingText !== 'string') {
      throw new ValidationError('surroundingText must be a string if provided')
    }
    if (data.surroundingText.length > MAX_SURROUNDING_TEXT_LENGTH) {
      throw new ValidationError(`surroundingText exceeds maximum length of ${MAX_SURROUNDING_TEXT_LENGTH} characters`)
    }
  }

  // bibleVersion (optional, defaults to RVR1960)
  const bibleVersion = data.bibleVersion && typeof data.bibleVersion === 'string' ? data.bibleVersion : 'RVR1960'

  // insightType
  if (!data.insightType || !VALID_INSIGHT_TYPES.includes(data.insightType)) {
    throw new ValidationError(`insightType must be one of: ${VALID_INSIGHT_TYPES.join(', ')}`)
  }

  // language
  if (!data.language || !VALID_LANGUAGES.includes(data.language)) {
    throw new ValidationError(`language must be one of: ${VALID_LANGUAGES.join(', ')}`)
  }

  return {
    book: sanitizeText(data.book),
    chapter: data.chapter,
    verseStart: data.verseStart,
    verseEnd: data.verseEnd,
    verseText: sanitizeText(data.verseText),
    surroundingText: data.surroundingText ? sanitizeText(data.surroundingText) : undefined,
    bibleVersion,
    insightType: data.insightType,
    language: data.language,
  }
}
