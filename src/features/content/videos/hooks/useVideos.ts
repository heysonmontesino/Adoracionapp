import { useQuery } from '@tanstack/react-query'
import { fetchLatestSermons, fetchFeaturedVideo, fetchVideo } from '../repository'

export function useLatestSermons(pageLimit?: number) {
  return useQuery({
    queryKey: ['latest-sermons', pageLimit],
    queryFn: () => fetchLatestSermons(pageLimit),
    staleTime: 5 * 60 * 1000,
  })
}

export function useFeaturedVideo() {
  return useQuery({
    queryKey: ['featured-video'],
    queryFn: fetchFeaturedVideo,
    staleTime: 10 * 60 * 1000,
  })
}

export function useVideo(id: string) {
  return useQuery({
    queryKey: ['video', id],
    queryFn: () => fetchVideo(id),
    staleTime: 10 * 60 * 1000,
    enabled: id.length > 0,
  })
}
