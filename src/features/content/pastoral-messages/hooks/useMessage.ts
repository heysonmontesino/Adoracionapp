import { useQuery } from '@tanstack/react-query'
import { fetchMessage } from '../repository'

export function useMessage(id: string) {
  return useQuery({
    queryKey: ['pastoral-messages', id],
    queryFn: () => fetchMessage(id),
    staleTime: 5 * 60 * 1000,
    enabled: id.length > 0,
  })
}
