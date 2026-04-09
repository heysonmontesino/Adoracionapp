jest.mock('../../../services/firebase/firestore')

import {
  completeHabit,
  createHabit,
  fetchHabits,
  fetchProgressSnapshot,
  fetchTodayCompletions,
  isHabitCompletedToday,
  writeXPEvent,
} from '../repository'
import * as firestoreService from '../../../services/firebase/firestore'

const mockProgress = {
  xp: 0,
  level: 1 as const,
  streakDays: 0,
  longestStreak: 0,
  lastActivityDate: '2020-01-01', // far past → streak will reset to 1
  totalPrayersOffered: 0,
}

const uid = 'user-1'

beforeEach(() => {
  jest.clearAllMocks()
  ;(firestoreService.Timestamp.now as jest.Mock).mockReturnValue({
    seconds: 0,
    nanoseconds: 0,
  })
})

describe('progress repository', () => {
  describe('fetchProgressSnapshot', () => {
    it('returns progress from user doc', async () => {
      jest
        .spyOn(firestoreService, 'getDocument')
        .mockResolvedValue({ progress: mockProgress } as never)

      const result = await fetchProgressSnapshot(uid)

      expect(firestoreService.getDocument).toHaveBeenCalledWith(`users/${uid}`)
      expect(result).toEqual(mockProgress)
    })

    it('returns null when user doc does not exist', async () => {
      jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(null)

      expect(await fetchProgressSnapshot(uid)).toBeNull()
    })
  })

  describe('writeXPEvent', () => {
    it('writes to xp-events collection with correct fields', async () => {
      jest.spyOn(firestoreService, 'addDocument').mockResolvedValue('evt-1')

      const id = await writeXPEvent(uid, 'habit_completed', 50, 'habit-abc')

      expect(firestoreService.addDocument).toHaveBeenCalledWith(
        'xp-events',
        expect.objectContaining({
          userId: uid,
          type: 'habit_completed',
          xpAwarded: 50,
          sourceId: 'habit-abc',
        }),
      )
      expect(id).toBe('evt-1')
    })
  })

  describe('fetchHabits', () => {
    it('queries active habits for a user', async () => {
      const habit = { id: 'h1', name: 'Oración', xpReward: 50, active: true }
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([habit] as never)

      const result = await fetchHabits(uid)

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        `users/${uid}/habits`,
        expect.anything(),
        expect.anything(),
      )
      expect(result).toEqual([habit])
    })
  })

  describe('createHabit', () => {
    it('creates a habit document and returns the id', async () => {
      jest.spyOn(firestoreService, 'addDocument').mockResolvedValue('habit-new')

      const id = await createHabit(uid, { name: 'Lectura bíblica', xpReward: 50 })

      expect(firestoreService.addDocument).toHaveBeenCalledWith(
        `users/${uid}/habits`,
        expect.objectContaining({
          name: 'Lectura bíblica',
          xpReward: 50,
          active: true,
        }),
      )
      expect(id).toBe('habit-new')
    })
  })

  describe('fetchTodayCompletions', () => {
    it('queries completions for today', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([])

      await fetchTodayCompletions(uid)

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        `users/${uid}/habit-completions`,
        expect.anything(), // where dateKey == today
      )
    })
  })

  describe('isHabitCompletedToday', () => {
    it('returns true when completion doc exists', async () => {
      jest.spyOn(firestoreService, 'getDocument').mockResolvedValue({ habitId: 'h1' } as never)
      expect(await isHabitCompletedToday(uid, 'h1')).toBe(true)
    })

    it('returns false when completion doc does not exist', async () => {
      jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(null)
      expect(await isHabitCompletedToday(uid, 'h1')).toBe(false)
    })
  })

  describe('completeHabit', () => {
    // Helper: configure executeTransaction mock to simulate tx.get returning a value
    function mockTransaction(txGetReturn: unknown) {
      let capturedTx: { get: jest.Mock; set: jest.Mock; update: jest.Mock }

      jest.spyOn(firestoreService, 'executeTransaction').mockImplementation(
        async (callback: (tx: typeof capturedTx) => Promise<unknown>) => {
          capturedTx = {
            get: jest.fn().mockResolvedValue(txGetReturn),
            set: jest.fn(),
            update: jest.fn(),
          }
          return callback(capturedTx)
        },
      )

      return { getCapturedTx: () => capturedTx! }
    }

    it('returns null when habit is already completed today (idempotent guard fires inside tx)', async () => {
      mockTransaction({ habitId: 'h1' }) // tx.get returns an existing doc

      const result = await completeHabit(uid, 'h1', mockProgress)

      expect(result).toBeNull()
      // Transaction still ran — but no writes happened
      const { getCapturedTx } = mockTransaction({ habitId: 'h1' })
      await completeHabit(uid, 'h1', mockProgress)
      const tx = getCapturedTx()
      expect(tx.set).not.toHaveBeenCalled()
      expect(tx.update).not.toHaveBeenCalled()
    })

    it('writes all three documents atomically when not yet completed', async () => {
      const { getCapturedTx } = mockTransaction(null) // tx.get returns null → not done yet

      const result = await completeHabit(uid, 'h1', mockProgress)

      const tx = getCapturedTx()
      expect(result).not.toBeNull()
      expect(result?.xpAwarded).toBe(50)

      // Completion doc written with idempotent key
      expect(tx.set).toHaveBeenCalledWith(
        expect.stringContaining(`users/${uid}/habit-completions/h1_`),
        expect.objectContaining({ habitId: 'h1', xpAwarded: 50 }),
      )

      // XP event written with pre-generated ID (mock returns 'mock-xp-event-id')
      expect(tx.set).toHaveBeenCalledWith(
        'xp-events/mock-xp-event-id',
        expect.objectContaining({ userId: uid, type: 'habit_completed', xpAwarded: 50 }),
      )

      // User progress updated in same transaction
      expect(tx.update).toHaveBeenCalledWith(
        `users/${uid}`,
        expect.objectContaining({ progress: expect.any(Object) }),
      )

      // Old sequential helpers NOT called
      expect(firestoreService.setDocument).not.toHaveBeenCalled()
      expect(firestoreService.addDocument).not.toHaveBeenCalled()
      expect(firestoreService.updateDocument).not.toHaveBeenCalled()
    })

    it('reports didLevelUp when XP crosses a level threshold', async () => {
      mockTransaction(null)

      // 490 XP + 50 = 540 → crosses level 2 threshold at 500
      const nearLevelUp = { ...mockProgress, xp: 490, level: 1 as const }
      const result = await completeHabit(uid, 'h1', nearLevelUp)

      expect(result?.didLevelUp).toBe(true)
    })

    it('reports isStreakMilestone on milestone days', async () => {
      mockTransaction(null)

      // Streak 6 + next consecutive day = 7 (milestone)
      const nearMilestone = {
        ...mockProgress,
        streakDays: 6,
        longestStreak: 6,
        lastActivityDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
      }
      const result = await completeHabit(uid, 'h1', nearMilestone)

      expect(result?.isStreakMilestone).toBe(true)
    })

    it('reports didLevelUp false and isStreakMilestone false on a normal completion', async () => {
      mockTransaction(null)

      const result = await completeHabit(uid, 'h1', mockProgress) // 0 XP, streak 0

      expect(result?.didLevelUp).toBe(false)
      // streak goes from 0 → 1 (not a milestone day)
      expect(result?.isStreakMilestone).toBe(false)
    })
  })
})
