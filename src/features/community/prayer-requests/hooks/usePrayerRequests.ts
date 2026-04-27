import { useQuery } from '@tanstack/react-query'
import type { UserRole } from '../../../auth/types'
import { fetchPrayerRequests } from '../repository'
import type { PrayerRequestType } from '../types'

export function usePrayerRequests(role: UserRole, type: PrayerRequestType = 'community') {
  return useQuery({
    queryKey: ['prayer-requests', type, role],
    queryFn: () => fetchPrayerRequests(role, type),
    staleTime: 60 * 1000,
  })
}
