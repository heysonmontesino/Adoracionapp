import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserRole } from '../../../auth/types'
import { prayForRequest } from '../repository'

interface PrayVariables {
  requestId: string
  userId: string
  role: UserRole
}

export function usePrayForRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, userId }: PrayVariables) =>
      prayForRequest(requestId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] })
    },
  })
}
