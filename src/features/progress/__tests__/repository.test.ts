jest.mock('../../../services/firebase/firestore')

import {
  completeHabit,
  createHabit,
  fetchHabits,
  fetchProgressSnapshot,
  fetchTodayCompletions,
  isHabitCompletedToday,
  writeXPEvent,
  toggleChallenge,
} from '../repository'
import * as firestoreService from '../../../services/firebase/firestore'
import * as streakEngine from '../engine/streaks'

jest.mock('../engine/streaks', () => ({
  ...jest.requireActual('../engine/streaks'),
  getTodayDateKey: jest.fn(),
}))

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
  ;(streakEngine.getTodayDateKey as jest.Mock).mockReturnValue('2024-01-01')
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

    it('returns a default snapshot when user doc does not exist', async () => {
      jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(null)

      expect(await fetchProgressSnapshot(uid)).toEqual({
        xp: 0,
        level: 1,
        streakDays: 0,
        longestStreak: 0,
        lastActivityDate: '2024-01-01',
        totalPrayersOffered: 0,
      })
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
    // Helper: configure executeTransaction mock to simulate tx.get returning different values based on path
    function setupTransactionMock(pathReturns: Record<string, any> = {}) {
      const capturedTx = {
        get: jest.fn((path: string) => Promise.resolve(pathReturns[path] ?? null)),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }

      jest.spyOn(firestoreService, 'executeTransaction').mockImplementation(
        async (callback: (tx: typeof capturedTx) => Promise<unknown>) => {
          return callback(capturedTx)
        },
      )

      return capturedTx
    }

    it('returns null when habit is already completed today (idempotent guard fires inside tx)', async () => {
      const today = '2024-01-01' // actual key used depends on engine/streaks
      // We need to know the exact path used. In repository.ts: `users/${uid}/habit-completions/${id}`
      const completionId = `h1_${today}` 
      
      const tx = setupTransactionMock({
        [`users/${uid}/habit-completions/${completionId}`]: { habitId: 'h1' }
      })

      const result = await completeHabit(uid, 'h1')

      expect(result).toBeNull()
      expect(tx.set).not.toHaveBeenCalled()
      expect(tx.update).not.toHaveBeenCalled()
    })

    it('writes all three documents atomically when not yet completed', async () => {
      const tx = setupTransactionMock({
        [`users/${uid}`]: { progress: mockProgress }
      })

      const result = await completeHabit(uid, 'h1')

      expect(result).not.toBeNull()
      expect(result?.xpAwarded).toBe(50)

      // Completion doc written with idempotent key
      expect(tx.set).toHaveBeenCalledWith(
        expect.stringContaining(`users/${uid}/habit-completions/h1_`),
        expect.objectContaining({ habitId: 'h1', xpAwarded: 50 }),
      )

      // XP event written with determinista ID
      expect(tx.set).toHaveBeenCalledWith(
        expect.stringContaining('xp-events/grant_habit_h1_'),
        expect.objectContaining({ userId: uid, type: 'habit_completed', xpAwarded: 50 }),
      )

      // User progress updated in same transaction
      expect(tx.update).toHaveBeenCalledWith(
        `users/${uid}`,
        expect.objectContaining({ progress: expect.any(Object) }),
      )
    })

    it('reports didLevelUp when XP crosses a level threshold', async () => {
      // 140 XP + 50 = 190 → crosses level 2 threshold at 150
      const nearLevelUp = { ...mockProgress, xp: 140, level: 1 as const }
      
      const tx = setupTransactionMock({
        [`users/${uid}`]: { progress: nearLevelUp }
      })

      const result = await completeHabit(uid, 'h1')

      expect(result?.didLevelUp).toBe(true)
      expect(tx.update).toHaveBeenCalledWith(
        `users/${uid}`,
        expect.objectContaining({
          progress: expect.objectContaining({ level: 2 })
        })
      )
    })

    it('reports isStreakMilestone on milestone days', async () => {
      // Streak 6 + next consecutive day = 7 (milestone)
      const nearMilestone = {
        ...mockProgress,
        streakDays: 6,
        longestStreak: 6,
        lastActivityDate: '2023-12-31', // yesterday relative to 2024-01-01
      }
      
      setupTransactionMock({
        [`users/${uid}`]: { progress: nearMilestone }
      })

      const result = await completeHabit(uid, 'h1')

      expect(result?.isStreakMilestone).toBe(true)
    })

    it('reports didLevelUp false and isStreakMilestone false on a normal completion', async () => {
      setupTransactionMock({
        [`users/${uid}`]: { progress: mockProgress }
      })

      const result = await completeHabit(uid, 'h1') // 0 XP, streak 0

      expect(result?.didLevelUp).toBe(false)
      expect(result?.isStreakMilestone).toBe(false)
    })
  })

  describe('toggleChallenge', () => {
    function setupTransactionMock(pathReturns: Record<string, any> = {}) {
      const capturedTx = {
        get: jest.fn((path: string) => Promise.resolve(pathReturns[path] ?? null)),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }

      jest.spyOn(firestoreService, 'executeTransaction').mockImplementation(
        async (callback: (tx: typeof capturedTx) => Promise<unknown>) => {
          return callback(capturedTx)
        },
      )

      return capturedTx
    }

    it('adds XP and creates document when toggling ON', async () => {
      const tx = setupTransactionMock({
        [`users/${uid}`]: { progress: mockProgress }
      })

      await toggleChallenge(uid, 'chal-1', 'daily', 20, true, 'chal-1_daily_2024-01-01')

      expect(tx.set).toHaveBeenCalledWith(
        expect.stringContaining('challenge-completions/chal-1_daily_2024-01-01'),
        expect.any(Object)
      )
      expect(tx.update).toHaveBeenCalledWith(
        `users/${uid}`,
        expect.objectContaining({
          progress: expect.objectContaining({ xp: 20 })
        })
      )
    })

    it('removes XP and deletes document when toggling OFF', async () => {
      const tx = setupTransactionMock({
        [`users/${uid}/challenge-completions/chal-1_daily_2024-01-01`]: { challengeId: 'chal-1' },
        [`users/${uid}`]: { progress: { ...mockProgress, xp: 100 } }
      })

      await toggleChallenge(uid, 'chal-1', 'daily', 20, false, 'chal-1_daily_2024-01-01')

      expect(tx.delete).toHaveBeenCalledWith(
        expect.stringContaining('challenge-completions/chal-1_daily_2024-01-01')
      )
      expect(tx.update).toHaveBeenCalledWith(
        `users/${uid}`,
        expect.objectContaining({
          progress: expect.objectContaining({ xp: 80 })
        })
      )
    })
  })
})
