import { useQuery } from '@tanstack/react-query'
import { fetchChannelPosts } from '../repository'

export function useChannelPosts(channelId: string) {
  return useQuery({
    queryKey: ['channel-posts', channelId],
    queryFn: () => fetchChannelPosts(channelId),
    staleTime: 60 * 1000,
    enabled: !!channelId,
  })
}
