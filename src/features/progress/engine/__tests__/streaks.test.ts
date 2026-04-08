import { isStreakMilestone, updateStreak } from '../streaks'

describe('progress engine — streaks', () => {
  describe('updateStreak', () => {
    it('does nothing when same day logged again', () => {
      const result = updateStreak('2026-04-08', 5, 10, '2026-04-08')
      expect(result.streakDays).toBe(5)
      expect(result.longestStreak).toBe(10)
      expect(result.isNewDay).toBe(false)
      expect(result.isStreakBroken).toBe(false)
    })

    it('increments streak on consecutive day', () => {
      const result = updateStreak('2026-04-07', 5, 10, '2026-04-08')
      expect(result.streakDays).toBe(6)
      expect(result.isNewDay).toBe(true)
      expect(result.isStreakBroken).toBe(false)
    })

    it('updates longestStreak when current exceeds it', () => {
      const result = updateStreak('2026-04-07', 10, 10, '2026-04-08')
      expect(result.streakDays).toBe(11)
      expect(result.longestStreak).toBe(11)
    })

    it('does not change longestStreak when current does not exceed it', () => {
      const result = updateStreak('2026-04-07', 3, 20, '2026-04-08')
      expect(result.streakDays).toBe(4)
      expect(result.longestStreak).toBe(20)
    })

    it('breaks streak and resets to 1 after a gap of 2 days', () => {
      const result = updateStreak('2026-04-06', 5, 10, '2026-04-08')
      expect(result.streakDays).toBe(1)
      expect(result.longestStreak).toBe(10) // longestStreak preserved
      expect(result.isStreakBroken).toBe(true)
      expect(result.isNewDay).toBe(true)
    })

    it('breaks streak after a long gap', () => {
      const result = updateStreak('2026-01-01', 30, 30, '2026-04-08')
      expect(result.streakDays).toBe(1)
      expect(result.isStreakBroken).toBe(true)
    })

    it('does not lower longestStreak when streak is broken', () => {
      const result = updateStreak('2026-04-01', 20, 50, '2026-04-08')
      expect(result.streakDays).toBe(1)
      expect(result.longestStreak).toBe(50)
    })

    it('handles first-ever activity (streak 0, same day)', () => {
      const result = updateStreak('2026-04-08', 0, 0, '2026-04-08')
      expect(result.streakDays).toBe(0)
      expect(result.isNewDay).toBe(false)
    })

    it('handles first-ever activity (streak 0, next day)', () => {
      const result = updateStreak('2026-04-07', 0, 0, '2026-04-08')
      expect(result.streakDays).toBe(1)
      expect(result.isNewDay).toBe(true)
      expect(result.isStreakBroken).toBe(false)
    })
  })

  describe('isStreakMilestone', () => {
    it('recognises milestone days', () => {
      expect(isStreakMilestone(3)).toBe(true)
      expect(isStreakMilestone(7)).toBe(true)
      expect(isStreakMilestone(14)).toBe(true)
      expect(isStreakMilestone(30)).toBe(true)
      expect(isStreakMilestone(60)).toBe(true)
      expect(isStreakMilestone(90)).toBe(true)
      expect(isStreakMilestone(180)).toBe(true)
      expect(isStreakMilestone(365)).toBe(true)
    })

    it('returns false for non-milestone days', () => {
      expect(isStreakMilestone(1)).toBe(false)
      expect(isStreakMilestone(2)).toBe(false)
      expect(isStreakMilestone(5)).toBe(false)
      expect(isStreakMilestone(100)).toBe(false)
    })
  })
})
