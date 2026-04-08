import { useQuery } from '@tanstack/react-query'
import type { UserRole } from '../../../auth/types'
import { fetchChannels } from '../repository'

export function useChannels(role: UserRole) {
  return useQuery({
    queryKey: ['channels', role],
    queryFn: () => fetchChannels(role),
    staleTime: 5 * 60 * 1000,
  })
}
