jest.mock('../../../services/firebase/auth')
jest.mock('../../../services/firebase/firestore')

import { getOrCreateUserDoc } from '../repository'
import * as firestoreService from '../../../services/firebase/firestore'

const mockFirebaseUser = {
  uid: 'user-1',
  email: 'pastor@adoracion.com',
  displayName: 'Pastor David',
  photoURL: null,
} as any

const mockExistingAppUser = {
  uid: 'user-1',
  email: 'pastor@adoracion.com',
  displayName: 'Pastor David',
  photoURL: null,
  role: 'pastor',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-01T00:00:00.000Z',
  onboardingCompleted: true,
  selectedChurchCampus: null,
  character: { gender: 'boy', stage: 3, assetKey: null },
  progress: { xp: 2000, level: 3, streakDays: 30, longestStreak: 45, lastActivityDate: '2026-04-06', totalPrayersOffered: 150 },
}

describe('getOrCreateUserDoc', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns existing user and updates lastLoginAt when doc exists', async () => {
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(mockExistingAppUser)
    jest.spyOn(firestoreService, 'updateDocument').mockResolvedValue(undefined)

    const result = await getOrCreateUserDoc(mockFirebaseUser)

    expect(firestoreService.getDocument).toHaveBeenCalledWith('users/user-1')
    expect(firestoreService.updateDocument).toHaveBeenCalledWith(
      'users/user-1',
      expect.objectContaining({ lastLoginAt: expect.any(String) }),
    )
    expect(result.uid).toBe('user-1')
    expect(result.role).toBe('pastor')
  })

  it('creates a new user doc with default values when doc does not exist', async () => {
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(null)
    jest.spyOn(firestoreService, 'setDocument').mockResolvedValue(undefined)

    const result = await getOrCreateUserDoc(mockFirebaseUser)

    expect(firestoreService.setDocument).toHaveBeenCalledWith(
      'users/user-1',
      expect.objectContaining({
        uid: 'user-1',
        role: 'member',
        status: 'active',
        onboardingCompleted: false,
      }),
    )
    expect(result.uid).toBe('user-1')
    expect(result.role).toBe('member')
    expect(result.status).toBe('active')
    expect(result.onboardingCompleted).toBe(false)
    expect(result.progress.xp).toBe(0)
    expect(result.progress.level).toBe(1)
    expect(result.character.stage).toBe(1)
  })
})
