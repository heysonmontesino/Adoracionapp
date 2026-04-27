import { useQuery } from '@tanstack/react-query'
import { fetchLiveStream, fetchUpcomingStreams } from '../repository'

export function useLiveStream() {
  return useQuery({
    queryKey: ['live-stream'],
    queryFn: fetchLiveStream,
    staleTime: 60 * 1000, // 1 min — live status changes often
    refetchInterval: 2 * 60 * 1000, // poll every 2 min
  })
}

export function useUpcomingStreams() {
  return useQuery({
    queryKey: ['upcoming-streams'],
    queryFn: fetchUpcomingStreams,
    staleTime: 5 * 60 * 1000,
  })
}
