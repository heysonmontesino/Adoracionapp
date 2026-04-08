import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../auth/store'
import { fetchProgressSnapshot } from '../repository'

export function useProgress() {
  const uid = useAuthStore((s) => s.user?.uid)

  return useQuery({
    queryKey: ['progress', uid],
    queryFn: () => fetchProgressSnapshot(uid!),
    enabled: !!uid,
    staleTime: 30 * 1000,
  })
}
