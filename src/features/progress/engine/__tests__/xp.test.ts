import { buildHabitCompletionId, getXPReward } from '../xp'

describe('progress engine — xp', () => {
  describe('getXPReward', () => {
    it('returns correct reward for known event types', () => {
      expect(getXPReward('habit_completed')).toBe(50)
      expect(getXPReward('prayer_offered')).toBe(25)
      expect(getXPReward('sermon_watched')).toBe(75)
      expect(getXPReward('streak_milestone')).toBe(100)
      expect(getXPReward('onboarding_complete')).toBe(200)
      expect(getXPReward('challenge_completed')).toBe(150)
    })
  })

  describe('buildHabitCompletionId', () => {
    it('formats as habitId_YYYY-MM-DD', () => {
      expect(buildHabitCompletionId('habit-abc', '2026-04-08')).toBe('habit-abc_2026-04-08')
    })

    it('is idempotent — same inputs produce same id', () => {
      const id1 = buildHabitCompletionId('habit-1', '2026-04-08')
      const id2 = buildHabitCompletionId('habit-1', '2026-04-08')
      expect(id1).toBe(id2)
    })

    it('differs for different dates', () => {
      const id1 = buildHabitCompletionId('habit-1', '2026-04-08')
      const id2 = buildHabitCompletionId('habit-1', '2026-04-09')
      expect(id1).not.toBe(id2)
    })

    it('differs for different habit IDs', () => {
      const id1 = buildHabitCompletionId('habit-1', '2026-04-08')
      const id2 = buildHabitCompletionId('habit-2', '2026-04-08')
      expect(id1).not.toBe(id2)
    })
  })
})
