import type { FirestoreTimestampValue } from '../../shared/types/firestore'

export interface HomePastorMessage {
  id: string
  title: string
  excerpt: string
  imageUrl: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  isActive: boolean
  publishedAt: FirestoreTimestampValue
}
