import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../auth/store'
import { useCharacterStore } from '../../character/store'
import { completeHabit } from '../repository'
import type { ProgressSnapshot } from '../types'

export function useHabitCompletion() {
  const uid = useAuthStore((s) => s.user?.uid)
  const queryClient = useQueryClient()
  const setAnimation = useCharacterStore((s) => s.setAnimation)

  return useMutation({
    mutationFn: ({
      habitId,
      currentProgress,
    }: {
      habitId: string
      currentProgress: ProgressSnapshot
    }) => completeHabit(uid!, habitId, currentProgress),

    onSuccess: (result) => {
      if (result === null) return // already completed today

      queryClient.invalidateQueries({ queryKey: ['progress', uid] })
      queryClient.invalidateQueries({ queryKey: ['habit-completions-today', uid] })

      // Trigger character animation based on outcome
      if (result.didLevelUp) {
        setAnimation('level_up')
      } else if (result.isStreakMilestone) {
        setAnimation('streak_milestone')
      } else {
        setAnimation('celebrate')
      }

      // Return character to idle after 3 seconds
      setTimeout(() => setAnimation('idle'), 3000)
    },
  })
}
