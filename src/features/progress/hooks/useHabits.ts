import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../auth/store'
import { fetchHabits, fetchTodayCompletions } from '../repository'

export function useHabits() {
  const uid = useAuthStore((s) => s.user?.uid)

  const habitsQuery = useQuery({
    queryKey: ['habits', uid],
    queryFn: () => fetchHabits(uid!),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
  })

  const completionsQuery = useQuery({
    queryKey: ['habit-completions-today', uid],
    queryFn: () => fetchTodayCompletions(uid!),
    enabled: !!uid,
    staleTime: 30 * 1000,
  })

  const completedTodayIds = new Set(
    completionsQuery.data?.map((c) => c.habitId) ?? [],
  )

  return {
    habits: habitsQuery.data ?? [],
    completedTodayIds,
    isLoading: habitsQuery.isLoading || completionsQuery.isLoading,
    isError: habitsQuery.isError || completionsQuery.isError,
    refetch: () => {
      habitsQuery.refetch()
      completionsQuery.refetch()
    },
  }
}
