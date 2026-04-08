import { useQuery } from '@tanstack/react-query'
import { fetchPinnedAnnouncement } from '../../content/announcements/repository'
import { fetchLatestMessage } from '../../content/pastoral-messages/repository'
import { fetchFeaturedSermon } from '../../content/sermons/repository'

async function fetchHomeData() {
  const [featuredSermon, latestMessage, pinnedAnnouncement] = await Promise.all([
    fetchFeaturedSermon(),
    fetchLatestMessage(),
    fetchPinnedAnnouncement(),
  ])

  return {
    featuredSermon,
    latestMessage,
    pinnedAnnouncement,
  }
}

export function useHomeData() {
  return useQuery({
    queryKey: ['home-content'],
    queryFn: fetchHomeData,
    staleTime: 60 * 1000,
  })
}
