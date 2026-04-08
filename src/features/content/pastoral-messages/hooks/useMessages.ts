import { useQuery } from '@tanstack/react-query'
import { fetchMessages } from '../repository'

export function useMessages() {
  return useQuery({
    queryKey: ['pastoral-messages'],
    queryFn: fetchMessages,
    staleTime: 5 * 60 * 1000,
  })
}
