import { limit, orderBy, where } from 'firebase/firestore'
import {
  getDocument,
  queryDocuments,
} from '../../../services/firebase/firestore'
import { PAGINATION } from '../../../config/constants'
import type { PastoralMessage } from './types'

const PASTORAL_MESSAGES_COLLECTION = 'pastoral-messages'

function withDocumentId<T extends { id: string }>(
  id: string,
  document: Omit<T, 'id'> | T | null,
): T | null {
  if (!document) return null
  return { ...document, id } as T
}

export async function fetchMessages(): Promise<PastoralMessage[]> {
  return queryDocuments<PastoralMessage>(
    PASTORAL_MESSAGES_COLLECTION,
    orderBy('publishedAt', 'desc'),
    limit(PAGINATION.messages),
  )
}

export async function fetchLatestMessage(): Promise<PastoralMessage | null> {
  const messages = await queryDocuments<PastoralMessage>(
    PASTORAL_MESSAGES_COLLECTION,
    orderBy('publishedAt', 'desc'),
    limit(1),
  )

  return messages[0] ?? null
}

export async function fetchMessage(id: string): Promise<PastoralMessage | null> {
  const message = await getDocument<PastoralMessage>(
    `${PASTORAL_MESSAGES_COLLECTION}/${id}`,
  )

  return withDocumentId(id, message)
}

export async function fetchPinnedMessage(): Promise<PastoralMessage | null> {
  const messages = await queryDocuments<PastoralMessage>(
    PASTORAL_MESSAGES_COLLECTION,
    where('pinned', '==', true),
    orderBy('publishedAt', 'desc'),
    limit(1),
  )

  return messages[0] ?? null
}
