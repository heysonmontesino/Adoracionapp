import { FirestoreTimestampValue } from '../../../shared/types/firestore'

export type ChannelType = 'public' | 'leaders' | 'pastors'

export interface Channel {
  id: string
  name: string
  description: string
  type: ChannelType
  createdAt: FirestoreTimestampValue
}

export interface ChannelPost {
  id: string
  userId: string
  displayName: string
  photoURL: string | null
  title: string | null
  body: string
  createdAt: FirestoreTimestampValue
}

export interface CreatePostInput {
  body: string
  title?: string
}
