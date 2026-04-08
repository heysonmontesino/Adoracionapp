jest.mock('../repository', () => ({
  completeOnboarding: jest.fn(),
}))

import { act, renderHook } from '@testing-library/react-native'
import { useOnboardingActions } from '../hooks/useOnboardingActions'
import { useAuthStore } from '../../auth/store'
import { useCharacterStore } from '../../character/store'
import * as onboardingRepository from '../repository'
import { AppUser } from '../../auth/types'
import { FirestoreTimestampValue } from '../../../shared/types/firestore'

const makeTimestamp = (seconds: number): FirestoreTimestampValue => ({
  seconds,
  nanoseconds: 0,
  toDate: () => new Date(seconds * 1000),
  toMillis: () => seconds * 1000,
  toJSON: () => ({ seconds, nanoseconds: 0, type: 'timestamp' }),
  valueOf: () => `Timestamp(seconds=${seconds}, nanoseconds=0)`,
  isEqual: (other: FirestoreTimestampValue) =>
    other.seconds === seconds && other.nanoseconds === 0,
})

const mockUser: AppUser = {
  uid: 'user-1',
  email: 'test@adoracion.com',
  displayName: 'Sara',
  photoURL: null,
  role: 'member',
  status: 'active',
  createdAt: makeTimestamp(1_700_000_000),
  lastLoginAt: makeTimestamp(1_700_000_001),
  onboardingCompleted: false,
  selectedChurchCampus: null,
  character: { gender: 'boy', stage: 1, assetKey: null },
  progress: {
    xp: 0,
    level: 1,
    streakDays: 0,
    longestStreak: 0,
    lastActivityDate: '2026-04-08',
    totalPrayersOffered: 0,
  },
}

describe('useOnboardingActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({ user: mockUser, isLoading: false, isAuthenticated: true })
    useCharacterStore.setState({ gender: 'boy', currentAnimation: 'idle', mode: 'lottie' })
  })

  it('updates local auth and character state after successful persistence', async () => {
    ;(onboardingRepository.completeOnboarding as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useOnboardingActions())

    await act(async () => {
      const success = await result.current.completeOnboardingForCurrentUser('girl')
      expect(success).toBe(true)
    })

    expect(useAuthStore.getState().user?.onboardingCompleted).toBe(true)
    expect(useAuthStore.getState().user?.character.gender).toBe('girl')
    expect(useCharacterStore.getState().gender).toBe('girl')
  })

  it('does not update local state when persistence fails', async () => {
    ;(onboardingRepository.completeOnboarding as jest.Mock).mockRejectedValue(
      new Error('firestore failed'),
    )

    const { result } = renderHook(() => useOnboardingActions())

    await act(async () => {
      const success = await result.current.completeOnboardingForCurrentUser('girl')
      expect(success).toBe(false)
    })

    expect(useAuthStore.getState().user?.onboardingCompleted).toBe(false)
    expect(useAuthStore.getState().user?.character.gender).toBe('boy')
    expect(useCharacterStore.getState().gender).toBe('boy')
  })
})
