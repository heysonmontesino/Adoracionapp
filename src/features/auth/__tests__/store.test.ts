import { useAuthStore } from '../store'
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

const mockUser = {
  uid: 'abc123',
  email: 'test@adoracion.com',
  displayName: 'Test User',
  photoURL: null,
  role: 'member' as const,
  status: 'active' as const,
  createdAt: makeTimestamp(1_700_000_000),
  lastLoginAt: makeTimestamp(1_700_000_001),
  onboardingCompleted: false,
  selectedChurchCampus: null,
  character: { gender: 'male' as const, stage: 'baby' as const, assetKey: null },
  progress: {
    xp: 0, level: 1 as const, streakDays: 0, longestStreak: 0,
    lastActivityDate: '2026-04-07', totalPrayersOffered: 0,
  },
}

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: true, isAuthenticated: false })
  })

  it('starts with no user and loading true', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isLoading).toBe(true)
    expect(state.isAuthenticated).toBe(false)
  })

  it('setUser with a user marks authenticated and stops loading', () => {
    useAuthStore.getState().setUser(mockUser)
    const state = useAuthStore.getState()
    expect(state.user).toBe(mockUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('setUser with null clears auth', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setUser(null)
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setLoading updates loading flag', () => {
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
