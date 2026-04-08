import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../auth/store'
import { createHabit } from '../repository'
import type { CreateHabitInput } from '../types'

export function useCreateHabit() {
  const uid = useAuthStore((s) => s.user?.uid)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateHabitInput) => createHabit(uid!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', uid] })
    },
  })
}
