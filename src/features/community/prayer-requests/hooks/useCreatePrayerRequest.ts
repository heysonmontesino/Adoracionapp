import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserRole } from '../../../auth/types'
import { createPrayerRequest } from '../repository'
import type { CreatePrayerRequestInput } from '../types'

export interface CreatePrayerRequestVariables {
  userId: string
  displayName: string | null
  input: CreatePrayerRequestInput
  role: UserRole
}

export function useCreatePrayerRequest() {
  const queryClient = useQueryClient()

  return useMutation<string, Error, CreatePrayerRequestVariables>({
    mutationFn: (vars: CreatePrayerRequestVariables) => {
      console.log('[PrayerCreate/Hook] mutation start', {
        userId: vars.userId,
        type: vars.input.type,
        role: vars.role,
      })
      return createPrayerRequest(vars.userId, vars.displayName, vars.input)
    },
    onSuccess: (_data, variables) => {
      console.log('[PrayerCreate/Hook] mutation success — invalidating queries')
      queryClient.invalidateQueries({
        queryKey: ['prayer-requests', variables.input.type, variables.role],
      })
      queryClient.invalidateQueries({
        queryKey: ['prayer-requests'],
      })
    },
    onError: (error: Error) => {
      console.error('[PrayerCreate/Hook] mutation error:', error.message)
    },
  })
}
