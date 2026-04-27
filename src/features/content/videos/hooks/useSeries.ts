import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries, fetchSeries, fetchSeriesEpisodes } from '../repository'

export function useAllSeries() {
  return useQuery({
    queryKey: ['sermon-series'],
    queryFn: fetchAllSeries,
    staleTime: 10 * 60 * 1000,
  })
}

export function useSeriesDetail(slug: string) {
  return useQuery({
    queryKey: ['sermon-series', slug],
    queryFn: () => fetchSeries(slug),
    staleTime: 10 * 60 * 1000,
    enabled: slug.length > 0,
  })
}

export function useSeriesEpisodes(slug: string) {
  return useQuery({
    queryKey: ['series-episodes', slug],
    queryFn: () => fetchSeriesEpisodes(slug),
    staleTime: 10 * 60 * 1000,
    enabled: slug.length > 0,
  })
}
