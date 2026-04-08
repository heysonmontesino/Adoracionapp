import { limit, orderBy, where } from 'firebase/firestore'
import { queryDocuments } from '../../../services/firebase/firestore'
import { PAGINATION } from '../../../config/constants'
import type { Announcement } from './types'

const ANNOUNCEMENTS_COLLECTION = 'announcements'

export async function fetchAnnouncements(): Promise<Announcement[]> {
  return queryDocuments<Announcement>(
    ANNOUNCEMENTS_COLLECTION,
    orderBy('publishedAt', 'desc'),
    limit(PAGINATION.announcements),
  )
}

export async function fetchPinnedAnnouncement(): Promise<Announcement | null> {
  const announcements = await queryDocuments<Announcement>(
    ANNOUNCEMENTS_COLLECTION,
    where('pinned', '==', true),
    orderBy('publishedAt', 'desc'),
    limit(1),
  )

  return announcements[0] ?? null
}
