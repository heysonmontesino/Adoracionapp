import { FirestoreTimestampValue } from '../../../shared/types/firestore'

export type PrayerRequestType = 'community' | 'pastoral'
export type PrayerRequestCategory = 'general' | 'salud' | 'familia' | 'finanzas' | 'otros'
export type PrayerRequestStatus = 'active' | 'answered' | 'archived' | 'flagged' | 'hidden'

export interface PrayerRequest {
  id: string
  userId: string
  author: {
    displayName: string | null
    isAnonymous: boolean
  }
  title: string | null
  body: string
  type: PrayerRequestType
  category: PrayerRequestCategory
  status: PrayerRequestStatus
  prayerCount: number
  createdAt: FirestoreTimestampValue
  updatedAt: FirestoreTimestampValue
  answeredAt: FirestoreTimestampValue | null
  moderatedAt?: FirestoreTimestampValue | null
}

export interface CreatePrayerRequestInput {
  title?: string
  body: string
  type: PrayerRequestType
  category: PrayerRequestCategory
  anonymous: boolean
}

export interface UpdatePrayerRequestInput {
  title: string | null
  body: string
  category: PrayerRequestCategory
  anonymous: boolean
}
