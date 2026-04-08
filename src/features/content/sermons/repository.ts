import { limit, orderBy, where } from 'firebase/firestore'
import {
  getDocument,
  queryDocuments,
} from '../../../services/firebase/firestore'
import { PAGINATION } from '../../../config/constants'
import type { Sermon } from './types'

const SERMONS_COLLECTION = 'sermons'

function withDocumentId<T extends { id: string }>(
  id: string,
  document: Omit<T, 'id'> | T | null,
): T | null {
  if (!document) return null
  return { ...document, id } as T
}

export async function fetchSermons(): Promise<Sermon[]> {
  return queryDocuments<Sermon>(
    SERMONS_COLLECTION,
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    limit(PAGINATION.sermons),
  )
}

export async function fetchSermon(id: string): Promise<Sermon | null> {
  const sermon = await getDocument<Sermon>(`${SERMONS_COLLECTION}/${id}`)
  return withDocumentId(id, sermon)
}

export async function fetchFeaturedSermon(): Promise<Sermon | null> {
  const sermons = await queryDocuments<Sermon>(
    SERMONS_COLLECTION,
    where('status', '==', 'published'),
    where('featured', '==', true),
    orderBy('publishedAt', 'desc'),
    limit(1),
  )

  return sermons[0] ?? null
}
