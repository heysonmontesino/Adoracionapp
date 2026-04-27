import { useQuery } from '@tanstack/react-query'
import { fetchContentFeed } from '../videos/feed/repository'

export function useContentFeed() {
  return useQuery({
    queryKey: ['content-feed'],
    queryFn: fetchContentFeed,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
