import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markAsAnswered, archivePrayerRequest, updatePrayerRequestContent } from '../repository'
import type { UpdatePrayerRequestInput } from '../types'

export function useMarkAsAnswered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => markAsAnswered(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] })
    },
  })
}

export function useArchivePrayerRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => archivePrayerRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] })
    },
  })
}

export function useUpdatePrayerRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      displayName,
      input,
    }: {
      requestId: string
      displayName: string | null
      input: UpdatePrayerRequestInput
    }) => updatePrayerRequestContent(requestId, displayName, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] })
    },
  })
}
