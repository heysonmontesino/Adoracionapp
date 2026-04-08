import { FirestoreTimestampValue } from '../../../shared/types/firestore'

export interface PastoralMessage {
  id: string
  title: string
  body: string
  pastor: string
  coverImageURL: string | null
  publishedAt: FirestoreTimestampValue
  pinned: boolean
}
