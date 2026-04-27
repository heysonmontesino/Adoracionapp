export type BibleAiInsightType = 'context' | 'original_language'

export type BibleAiRequest = {
  book: string
  chapter: number
  verseStart: number
  verseEnd?: number
  verseText: string
  surroundingText?: string
  bibleVersion?: string
  insightType: BibleAiInsightType
  language: 'es'
}

export type BibleAiInsightSection = {
  title: string
  body: string
}

export type BibleAiInsight = {
  title: string
  subtitle?: string
  type: BibleAiInsightType
  sections: BibleAiInsightSection[]
  disclaimer: string
}

export type BibleAiResponse = BibleAiInsight & {
  source: 'cache' | 'generated_mock' | 'generated_ai'
  cachedAt?: string
  generatedAt?: string
}
