import { useQuery } from '@tanstack/react-query'
import type { UserRole } from '../../../auth/types'
import { fetchPrayerRequests } from '../repository'

export function usePrayerRequests(role: UserRole) {
  return useQuery({
    queryKey: ['prayer-requests', role],
    queryFn: () => fetchPrayerRequests(role),
    staleTime: 60 * 1000,
  })
}
