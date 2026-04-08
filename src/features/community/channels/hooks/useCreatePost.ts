import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPost } from '../repository'
import type { CreatePostInput } from '../types'

interface CreatePostVariables {
  channelId: string
  userId: string
  displayName: string
  photoURL: string | null
  input: CreatePostInput
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ channelId, userId, displayName, photoURL, input }: CreatePostVariables) =>
      createPost(channelId, userId, displayName, photoURL, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channel-posts', variables.channelId] })
    },
  })
}
