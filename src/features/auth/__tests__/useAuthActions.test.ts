jest.mock('../repository', () => ({
  createUserDoc: jest.fn(),
  getOrCreateUserDoc: jest.fn(),
  isGoogleSignInConfigured: jest.fn(() => true),
  registerWithEmail: jest.fn(),
  signInWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  updateAuthDisplayName: jest.fn(),
}))

import { act, renderHook } from '@testing-library/react-native'
import { useAuthActions } from '../hooks/useAuthActions'
import { useAuthStore } from '../store'
import * as repository from '../repository'
import { AppUser } from '../types'
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
  displayName: 'Ana',
  photoURL: null,
  role: 'member',
  status: 'active',
  createdAt: makeTimestamp(1_700_000_000),
  lastLoginAt: makeTimestamp(1_700_000_001),
  onboardingCompleted: false,
  selectedChurchCampus: null,
  character: { gender: 'female', stage: 'baby', assetKey: null },
  progress: {
    xp: 0,
    level: 1,
    streakDays: 0,
    longestStreak: 0,
    lastActivityDate: '2026-04-08',
    totalPrayersOffered: 0,
  },
}

describe('useAuthActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({ user: null, isLoading: false, isAuthenticated: false })
  })

  it('registers and stores the created app user', async () => {
    const firebaseUser = { uid: 'user-1' } as never

    ;(repository.registerWithEmail as jest.Mock).mockResolvedValue(firebaseUser)
    ;(repository.updateAuthDisplayName as jest.Mock).mockResolvedValue(undefined)
    ;(repository.createUserDoc as jest.Mock).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuthActions())

    await act(async () => {
      await result.current.registerAccount(' Ana ', 'test@adoracion.com', 'secret123')
    })

    expect(repository.updateAuthDisplayName).toHaveBeenCalledWith(firebaseUser, 'Ana')
    expect(repository.createUserDoc).toHaveBeenCalledWith(firebaseUser, {
      displayName: 'Ana',
    })
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('rolls back the firebase session when persistence fails after account creation', async () => {
    const firebaseUser = { uid: 'user-1' } as never

    ;(repository.registerWithEmail as jest.Mock).mockResolvedValue(firebaseUser)
    ;(repository.updateAuthDisplayName as jest.Mock).mockResolvedValue(undefined)
    ;(repository.createUserDoc as jest.Mock).mockRejectedValue(new Error('firestore failed'))
    ;(repository.signOut as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuthActions())

    await act(async () => {
      const response = await result.current.registerAccount('Ana', 'test@adoracion.com', 'secret123')
      expect(response).toEqual({ ok: false, code: undefined })
    })

    expect(repository.signOut).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('lets auth bootstrap own user doc sync after Google sign-in', async () => {
    const firebaseUser = { uid: 'google-user-1' } as never

    ;(repository.signInWithGoogle as jest.Mock).mockResolvedValue(firebaseUser)

    const { result } = renderHook(() => useAuthActions())

    await act(async () => {
      const response = await result.current.authenticateWithGoogle()
      expect(response).toBe(true)
    })

    expect(repository.signInWithGoogle).toHaveBeenCalledTimes(1)
    expect(repository.getOrCreateUserDoc).not.toHaveBeenCalled()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
