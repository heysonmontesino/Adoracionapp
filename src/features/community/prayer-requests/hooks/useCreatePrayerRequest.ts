import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserRole } from '../../../auth/types'
import { createPrayerRequest } from '../repository'
import type { CreatePrayerRequestInput } from '../types'

interface CreateVariables {
  userId: string
  displayName: string
  input: CreatePrayerRequestInput
  role: UserRole
}

export function useCreatePrayerRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, displayName, input }: CreateVariables) =>
      createPrayerRequest(userId, displayName, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prayer-requests', variables.role] })
    },
  })
}
