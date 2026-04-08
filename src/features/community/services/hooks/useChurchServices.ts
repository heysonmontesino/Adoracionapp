import { useQuery } from '@tanstack/react-query'
import { fetchChurchServices } from '../repository'

export function useChurchServices() {
  return useQuery({
    queryKey: ['church-services'],
    queryFn: fetchChurchServices,
    staleTime: 10 * 60 * 1000,
  })
}
