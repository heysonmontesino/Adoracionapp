import { FirestoreTimestampValue } from '../../../shared/types/firestore'

export type SermonStatus = 'published' | 'draft'

export interface Sermon {
  id: string
  title: string
  description: string
  source: 'youtube'
  status: SermonStatus
  youtubeVideoId: string
  youtubeURL: string
  thumbnailURL: string
  duration: string
  publishedAt: FirestoreTimestampValue
  syncedAt: FirestoreTimestampValue | null
  pastor: string
  series: string | null
  tags: string[]
  featured: boolean
}
