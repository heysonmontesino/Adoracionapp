import { FirestoreTimestampValue } from '../../../shared/types/firestore'

export type AnnouncementType = 'event' | 'announcement' | 'news'

export interface Announcement {
  id: string
  type: AnnouncementType
  title: string
  body: string
  imageURL: string | null
  publishedAt: FirestoreTimestampValue
  expiresAt: FirestoreTimestampValue | null
  pinned: boolean
  ctaLabel: string | null
  ctaUrl: string | null
}
