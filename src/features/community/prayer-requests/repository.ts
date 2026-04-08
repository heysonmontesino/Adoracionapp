import { increment, limit, orderBy, where } from 'firebase/firestore'
import {
  addDocument,
  getDocument,
  queryDocuments,
  setDocument,
  updateDocument,
  Timestamp,
} from '../../../services/firebase/firestore'
import { PAGINATION } from '../../../config/constants'
import type { UserRole } from '../../auth/types'
import type {
  CreatePrayerRequestInput,
  PrayerRequest,
} from './types'

const COLLECTION = 'prayer-requests'

export async function fetchPrayerRequests(
  role: UserRole,
): Promise<PrayerRequest[]> {
  const isLeaderOrAbove = role === 'leader' || role === 'pastor' || role === 'admin'

  if (isLeaderOrAbove) {
    return queryDocuments<PrayerRequest>(
      COLLECTION,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(PAGINATION.prayerRequests),
    )
  }

  return queryDocuments<PrayerRequest>(
    COLLECTION,
    where('visibility', '==', 'public'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(PAGINATION.prayerRequests),
  )
}

export async function fetchPrayerRequest(id: string): Promise<PrayerRequest | null> {
  const doc = await getDocument<PrayerRequest>(`${COLLECTION}/${id}`)
  if (!doc) return null
  return { ...doc, id }
}

export async function createPrayerRequest(
  userId: string,
  displayName: string,
  input: CreatePrayerRequestInput,
): Promise<string> {
  const now = Timestamp.now()
  const data = {
    userId,
    displayName: input.anonymous ? null : displayName,
    anonymous: input.anonymous,
    title: input.title ?? null,
    body: input.body,
    visibility: input.visibility,
    prayerCount: 0,
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    answeredAt: null,
  }
  return addDocument(COLLECTION, data)
}

export async function prayForRequest(
  requestId: string,
  userId: string,
): Promise<void> {
  await setDocument(`${COLLECTION}/${requestId}/prayers/${userId}`, {
    prayedAt: Timestamp.now(),
  })
  await updateDocument(`${COLLECTION}/${requestId}`, {
    prayerCount: increment(1),
  })
}

export async function hasUserPrayed(
  requestId: string,
  userId: string,
): Promise<boolean> {
  const doc = await getDocument(`${COLLECTION}/${requestId}/prayers/${userId}`)
  return doc !== null
}
