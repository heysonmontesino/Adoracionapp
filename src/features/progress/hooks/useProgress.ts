import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../auth/store'
import { 
  fetchProgressSnapshot, 
  incrementUserXP, 
  updateCharacterOverride,
  fetchChallengeCompletions,
  toggleChallenge 
} from '../repository'
import type { XPEventType } from '../types'
import type { CharacterGender, SpiritualStage } from '../../character/types'

export function useProgress() {
  const uid = useAuthStore((s) => s.user?.uid)

  return useQuery({
    queryKey: ['progress', uid],
    queryFn: () => fetchProgressSnapshot(uid!),
    enabled: !!uid,
    staleTime: 0, // Garantiza que los cambios de XP se vean inmediatamente tras invalidar
  })
}

export function useUpdateXP() {
  const uid = useAuthStore((s) => s.user?.uid)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ amount, type }: { amount: number, type: string }) => {
      if (!uid) throw new Error('No user authenticated')
      return await incrementUserXP(uid, amount, type as XPEventType)
    },
    onMutate: async ({ amount }) => {
      await queryClient.cancelQueries({ queryKey: ['progress', uid] })
      const previousProgress = queryClient.getQueryData(['progress', uid])

      if (previousProgress) {
        queryClient.setQueryData(['progress', uid], (old: any) => ({
          ...old,
          xp: (old.xp || 0) + amount
        }))
      }

      return { previousProgress }
    },
    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(['progress', uid], context.previousProgress)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', uid] })
    },
  })
}

export function useUpdateCharacterOverride() {
  const uid = useAuthStore((s) => s.user?.uid)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (overrides: { stage?: SpiritualStage | number | null; gender?: CharacterGender | null }) => {
      if (!uid) throw new Error('No user authenticated')
      return await updateCharacterOverride(uid, overrides)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', uid] })
    },
  })
}

export function useChallengeCompletions() {
  const uid = useAuthStore((s) => s.user?.uid)

  return useQuery({
    queryKey: ['challenge-completions', uid],
    queryFn: async () => {
      console.log(`[useChallengeCompletions] Fetching for uid: ${uid}`);
      const data = await fetchChallengeCompletions(uid!);
      console.log(`[useChallengeCompletions] Received ${Object.keys(data).length} completions`);
      return data;
    },
    enabled: !!uid,
    staleTime: 0,
  })
}

export function useToggleChallenge() {
  const uid = useAuthStore((s) => s.user?.uid)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      challengeId: string,
      frequency: string,
      xp: number,
      isDone: boolean,
      completionKey: string
    }) => {
      if (!uid) throw new Error('No user authenticated')
      return await toggleChallenge(
        uid,
        params.challengeId,
        params.frequency,
        params.xp,
        params.isDone,
        params.completionKey
      )
    },
    onMutate: async (params) => {
      console.log(`[useToggleChallenge] onMutate start for ${params.challengeId}. uid: ${uid}`);
      if (!uid) {
        console.error('[useToggleChallenge] Error: No UID in onMutate');
        return;
      }

      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['progress', uid] })
      await queryClient.cancelQueries({ queryKey: ['challenge-completions', uid] })

      // 2. Snapshot current state
      const previousProgress = queryClient.getQueryData(['progress', uid])
      const previousCompletions = queryClient.getQueryData(['challenge-completions', uid])

      // 3. Optimistically update progress (XP)
      queryClient.setQueryData(['progress', uid], (old: any) => {
        if (!old) return old;
        const newXp = Math.max(0, (old.xp || 0) + (params.isDone ? params.xp : -params.xp));
        console.log(`[useToggleChallenge] Optimistic XP: ${old.xp} -> ${newXp}`);
        return {
          ...old,
          xp: newXp
        };
      })

      // 4. Optimistically update completions
      queryClient.setQueryData(['challenge-completions', uid], (old: any = {}) => {
        console.log(`[useToggleChallenge] Optimistic completions update for ${params.completionKey}: ${params.isDone}`);
        return {
          ...old,
          [params.completionKey]: params.isDone
        };
      })

      return { previousProgress, previousCompletions }
    },
    onError: (err, variables, context) => {
      console.error('[useToggleChallenge] onError:', err);
      // Rollback on error
      if (context?.previousProgress) {
        queryClient.setQueryData(['progress', uid], context.previousProgress)
      }
      if (context?.previousCompletions) {
        queryClient.setQueryData(['challenge-completions', uid], context.previousCompletions)
      }
    },
    onSuccess: (data, variables) => {
      console.log(`[useToggleChallenge] onSuccess for ${variables.challengeId}`);
      if (data?.updated) {
        // Actualizamos el progreso con el snapshot real del servidor para evitar el flicker
        queryClient.setQueryData(['progress', uid], data.updated)
      }
    },
    onSettled: () => {
      console.log('[useToggleChallenge] onSettled - Marking queries as stale');
      // Marcamos como stale para que se refresquen eventualmente, pero sin forzar refetch inmediato
      // que podría devolver datos viejos debido a latencia de propagación en queries de Firestore.
      queryClient.invalidateQueries({ 
        queryKey: ['progress', uid],
        refetchType: 'none' 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['challenge-completions', uid],
        refetchType: 'none'
      })
    },
  })
}
