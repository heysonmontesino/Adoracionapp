import type { BibleAiRequest, BibleAiInsight } from './types'

/**
 * Bible AI Cache Manager
 * 
 * Current implementation: In-memory cache (resets on server restart)
 * 
 * Future: Replace with Firestore cache for persistence across restarts
 * 
 * Firestore structure:
 * bible_ai_cache/{cacheKey}
 * {
 *   insight: BibleAiInsight,
 *   cachedAt: Timestamp,
 *   bookName: string,
 *   chapter: number,
 *   verseStart: number,
 *   insightType: string
 * }
 * 
 * Rules recommendation:
 * match /bible_ai_cache/{cacheKey} {
 *   allow read: if true; // Public read for all users
 *   allow write: if false; // Only backend can write
 * }
 */

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

type CacheEntry = {
  insight: BibleAiInsight
  cachedAt: number
}

// In-memory cache (temporary until Firestore integration)
const memoryCache = new Map<string, CacheEntry>()

export function generateCacheKey(request: BibleAiRequest): string {
  const bookNormalized = request.book.toLowerCase().replace(/\s+/g, '-')
  const verseRange = request.verseEnd ? `${request.verseStart}-${request.verseEnd}` : `${request.verseStart}`
  const version = request.bibleVersion || 'default'
  
  return `bible-ai:${request.insightType}:${bookNormalized}:${request.chapter}:${verseRange}:${request.language}:${version}`
}

export async function getCachedInsight(cacheKey: string): Promise<BibleAiInsight | null> {
  // TODO: Replace with Firestore read when firebase-admin is installed
  // const admin = require('firebase-admin')
  // const db = admin.firestore()
  // const doc = await db.collection('bible_ai_cache').doc(cacheKey).get()
  // if (!doc.exists) return null
  // const data = doc.data()
  // if (Date.now() - data.cachedAt.toMillis() > CACHE_TTL_MS) return null
  // return data.insight as BibleAiInsight

  const entry = memoryCache.get(cacheKey)
  if (!entry) return null
  
  // Check TTL
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    memoryCache.delete(cacheKey)
    return null
  }
  
  return entry.insight
}

export async function cacheInsight(cacheKey: string, insight: BibleAiInsight): Promise<void> {
  // TODO: Replace with Firestore write when firebase-admin is installed
  // const admin = require('firebase-admin')
  // const db = admin.firestore()
  // await db.collection('bible_ai_cache').doc(cacheKey).set({
  //   insight,
  //   cachedAt: admin.firestore.FieldValue.serverTimestamp(),
  //   bookName: insight.subtitle?.split(' ')[0] || '',
  //   chapter: extractChapterFromSubtitle(insight.subtitle),
  //   verseStart: extractVerseStartFromSubtitle(insight.subtitle),
  //   insightType: insight.type,
  // })

  memoryCache.set(cacheKey, {
    insight,
    cachedAt: Date.now(),
  })
}
