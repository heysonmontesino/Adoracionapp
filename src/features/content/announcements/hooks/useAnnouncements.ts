import { useQuery } from '@tanstack/react-query'
import { fetchAnnouncements } from '../repository'

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: fetchAnnouncements,
    staleTime: 60 * 1000,
  })
}
