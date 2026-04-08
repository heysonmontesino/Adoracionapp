import { useQuery } from '@tanstack/react-query'
import { fetchSermons } from '../repository'

export function useSermons() {
  return useQuery({
    queryKey: ['sermons'],
    queryFn: fetchSermons,
    staleTime: 5 * 60 * 1000,
  })
}
