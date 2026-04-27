jest.mock('../../../services/firebase/auth')
jest.mock('../../../services/firebase/firestore')

import {
  createUserDoc,
  fetchUserDoc,
  getOrCreateUserDoc,
  updateLastLogin,
} from '../repository'
import * as firestoreService from '../../../services/firebase/firestore'
import { FirestoreTimestampValue } from '../../../shared/types/firestore'

const mockFirebaseUser = {
  uid: 'user-1',
  email: 'pastor@adoracion.com',
  displayName: 'Pastor David',
  photoURL: null,
  providerData: [{ providerId: 'google.com' }],
  isAnonymous: false,
} as any

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

const baseTimestamp = makeTimestamp(1_700_000_000)

const mockExistingAppUser = {
  uid: 'user-1',
  email: 'pastor@adoracion.com',
  displayName: 'Pastor David',
  photoURL: null,
  role: 'pastor',
  status: 'active',
  createdAt: baseTimestamp,
  lastLoginAt: baseTimestamp,
  onboardingCompleted: true,
  selectedChurchCampus: null,
  character: { gender: 'boy', stage: 3, assetKey: null },
  progress: { xp: 2000, level: 3, streakDays: 30, longestStreak: 45, lastActivityDate: '2026-04-06', totalPrayersOffered: 150 },
}

describe('getOrCreateUserDoc', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .spyOn(firestoreService.Timestamp, 'now')
      .mockReturnValue(
        baseTimestamp as unknown as ReturnType<typeof firestoreService.Timestamp.now>,
      )
  })

  it('fetches a user doc by path', async () => {
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(mockExistingAppUser)

    const result = await fetchUserDoc('user-1')

    expect(firestoreService.getDocument).toHaveBeenCalledWith('users/user-1')
    expect(result).toEqual(mockExistingAppUser)
  })

  it('creates a new user doc with timestamp fields and default values', async () => {
    jest.spyOn(firestoreService, 'setDocument').mockResolvedValue(undefined)

    const result = await createUserDoc(mockFirebaseUser, { displayName: 'Pastor Memo' })

    expect(firestoreService.setDocument).toHaveBeenCalledWith(
      'users/user-1',
      expect.objectContaining({
        uid: 'user-1',
        displayName: 'Pastor Memo',
        createdAt: baseTimestamp,
        lastLoginAt: baseTimestamp,
        onboardingCompleted: false,
      }),
    )
    expect(result.createdAt).toBe(baseTimestamp)
    expect(result.lastLoginAt).toBe(baseTimestamp)
    expect(result.progress.lastActivityDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('updates last login using a timestamp value', async () => {
    jest.spyOn(firestoreService, 'updateDocument').mockResolvedValue(undefined)

    await updateLastLogin('user-1')

    expect(firestoreService.updateDocument).toHaveBeenCalledWith('users/user-1', {
      lastLoginAt: baseTimestamp,
    })
  })

  it('returns existing user and updates lastLoginAt when doc exists', async () => {
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(mockExistingAppUser)
    jest.spyOn(firestoreService, 'updateDocument').mockResolvedValue(undefined)

    const result = await getOrCreateUserDoc(mockFirebaseUser)

    expect(firestoreService.getDocument).toHaveBeenCalledWith('users/user-1')
    expect(firestoreService.updateDocument).toHaveBeenCalledWith(
      'users/user-1',
      expect.objectContaining({ lastLoginAt: baseTimestamp }),
    )
    expect(result.uid).toBe('user-1')
    expect(result.role).toBe('pastor')
    expect(result.lastLoginAt).toBe(baseTimestamp)
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
    expect(result.createdAt).toBe(baseTimestamp)
  })

  it('recovers when a concurrent bootstrap creates the user doc first', async () => {
    jest
      .spyOn(firestoreService, 'getDocument')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockExistingAppUser)
    jest
      .spyOn(firestoreService, 'setDocument')
      .mockRejectedValue(Object.assign(new Error('Missing or insufficient permissions.'), {
        code: 'permission-denied',
      }))

    const result = await getOrCreateUserDoc(mockFirebaseUser)

    expect(firestoreService.setDocument).toHaveBeenCalledWith(
      'users/user-1',
      expect.objectContaining({ uid: 'user-1' }),
    )
    expect(firestoreService.getDocument).toHaveBeenCalledTimes(2)
    expect(result).toBe(mockExistingAppUser)
  })
})
