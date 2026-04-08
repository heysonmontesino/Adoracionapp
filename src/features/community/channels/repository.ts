import { limit, orderBy, where } from 'firebase/firestore'
import {
  addDocument,
  getDocument,
  queryDocuments,
  Timestamp,
} from '../../../services/firebase/firestore'
import { PAGINATION } from '../../../config/constants'
import type { UserRole } from '../../auth/types'
import type { Channel, ChannelPost, ChannelType, CreatePostInput } from './types'

const CHANNELS_COLLECTION = 'channels'

function accessibleChannelTypes(role: UserRole): ChannelType[] {
  if (role === 'pastor' || role === 'admin') return ['public', 'leaders', 'pastors']
  if (role === 'leader') return ['public', 'leaders']
  return ['public']
}

export async function fetchChannels(role: UserRole): Promise<Channel[]> {
  const types = accessibleChannelTypes(role)
  return queryDocuments<Channel>(
    CHANNELS_COLLECTION,
    where('type', 'in', types),
    orderBy('createdAt', 'asc'),
  )
}

export async function fetchChannel(id: string): Promise<Channel | null> {
  const doc = await getDocument<Channel>(`${CHANNELS_COLLECTION}/${id}`)
  if (!doc) return null
  return { ...doc, id }
}

export async function fetchChannelPosts(channelId: string): Promise<ChannelPost[]> {
  return queryDocuments<ChannelPost>(
    `${CHANNELS_COLLECTION}/${channelId}/posts`,
    orderBy('createdAt', 'desc'),
    limit(PAGINATION.posts),
  )
}

export async function createPost(
  channelId: string,
  userId: string,
  displayName: string,
  photoURL: string | null,
  input: CreatePostInput,
): Promise<string> {
  const data = {
    userId,
    displayName,
    photoURL,
    title: input.title ?? null,
    body: input.body,
    createdAt: Timestamp.now(),
  }
  return addDocument(`${CHANNELS_COLLECTION}/${channelId}/posts`, data)
}
