import { FirestoreTimestampValue } from '../../../shared/types/firestore'

export type PrayerRequestVisibility = 'public' | 'leaders_only'
export type PrayerRequestStatus = 'active' | 'answered' | 'archived'

export interface PrayerRequest {
  id: string
  userId: string
  displayName: string | null
  anonymous: boolean
  title: string | null
  body: string
  visibility: PrayerRequestVisibility
  prayerCount: number
  status: PrayerRequestStatus
  createdAt: FirestoreTimestampValue
  updatedAt: FirestoreTimestampValue
  answeredAt: FirestoreTimestampValue | null
}

export interface CreatePrayerRequestInput {
  body: string
  title?: string
  anonymous: boolean
  visibility: PrayerRequestVisibility
}
