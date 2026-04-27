jest.mock('../repository', () => ({
  getOrCreateUserDoc: jest.fn(),
  initGoogleSignIn: jest.fn(),
  onAuthStateChanged: jest.fn(),
}))
jest.mock('../../../shared/constants/config', () => ({
  Config: {
    DEMO_UI_MODE: true,
  },
}))
jest.mock('../demoUser', () => ({
  DEMO_USER: {
    uid: 'demo-user',
    email: 'demo@adoracion.app',
    displayName: 'Usuario Demo',
    photoURL: null,
    role: 'member',
    status: 'active',
    createdAt: { seconds: 0, nanoseconds: 0 },
    lastLoginAt: { seconds: 0, nanoseconds: 0 },
    onboardingCompleted: true,
    selectedChurchCampus: null,
    character: { gender: 'boy', stage: 1, assetKey: null },
    progress: {
      xp: 0,
      level: 1,
      streakDays: 0,
      longestStreak: 0,
      lastActivityDate: '2026-04-15',
      totalPrayersOffered: 0,
    },
  },
}))

import { renderHook } from '@testing-library/react-native'
import { useAuthBootstrap } from '../hooks/useAuthBootstrap'
import { useAuthStore } from '../store'
import * as repository from '../repository'
import { DEMO_USER } from '../demoUser'

describe('useAuthBootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({ user: null, isLoading: true, isAuthenticated: false })
  })

  it('seeds the demo user and skips firebase bootstrap in demo mode', () => {
    renderHook(() => useAuthBootstrap())

    expect(repository.initGoogleSignIn).not.toHaveBeenCalled()
    expect(repository.onAuthStateChanged).not.toHaveBeenCalled()
    expect(useAuthStore.getState().user).toEqual(DEMO_USER)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
