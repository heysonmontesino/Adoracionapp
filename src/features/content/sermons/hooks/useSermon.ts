import { useQuery } from '@tanstack/react-query'
import { fetchSermon } from '../repository'

export function useSermon(id: string) {
  return useQuery({
    queryKey: ['sermons', id],
    queryFn: () => fetchSermon(id),
    staleTime: 5 * 60 * 1000,
    enabled: id.length > 0,
  })
}
