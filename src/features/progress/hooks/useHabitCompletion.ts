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
    }: {
      habitId: string
    }) => completeHabit(uid!, habitId),

    onMutate: async ({ habitId }) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['progress', uid] })
      await queryClient.cancelQueries({ queryKey: ['habit-completions-today', uid] })

      // 2. Snapshot current state
      const previousProgress = queryClient.getQueryData(['progress', uid])
      const previousCompletions = queryClient.getQueryData(['habit-completions-today', uid])

      // 3. Optimistically update progress (XP)
      if (previousProgress) {
        queryClient.setQueryData(['progress', uid], (old: any) => ({
          ...old,
          xp: (old.xp || 0) + 50 // habit_completed reward
        }))
      }

      // 4. Optimistically update completions
      if (previousCompletions) {
        queryClient.setQueryData(['habit-completions-today', uid], (old: any[]) => [
          ...old,
          { habitId, dateKey: 'optimistic' } // Minimal object to satisfy UI
        ])
      }

      return { previousProgress, previousCompletions }
    },

    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(['progress', uid], context.previousProgress)
      }
      if (context?.previousCompletions) {
        queryClient.setQueryData(['habit-completions-today', uid], context.previousCompletions)
      }
    },

    onSuccess: (result) => {
      if (result === null) return // already completed today

      // Actualizar el progreso con el snapshot real del servidor para evitar el flicker
      queryClient.setQueryData(['progress', uid], result.updated)

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

    onSettled: () => {
      console.log('[useHabitCompletion] onSettled - Marking queries as stale');
      queryClient.invalidateQueries({ 
        queryKey: ['progress', uid],
        refetchType: 'none'
      })
      queryClient.invalidateQueries({ 
        queryKey: ['habit-completions-today', uid],
        refetchType: 'none'
      })
    },
  })
}

