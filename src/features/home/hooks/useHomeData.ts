import { useQuery } from '@tanstack/react-query'
import { fetchPinnedAnnouncement } from '../../content/announcements/repository'
import { fetchLatestSermonWithFallback } from '../../content/videos/repository'
import { fetchActiveHomePastorMessage } from '../repository'

async function resolveOrNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request
  } catch (error) {
    console.warn('[Home] Remote content unavailable', error)
    return null
  }
}

async function fetchHomeData() {
  const [latestSermon, pastorMessage, pinnedAnnouncement] = await Promise.all([
    resolveOrNull(fetchLatestSermonWithFallback()),
    resolveOrNull(fetchActiveHomePastorMessage()),
    resolveOrNull(fetchPinnedAnnouncement()),
  ])

  return {
    latestSermon,
    pastorMessage,
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
