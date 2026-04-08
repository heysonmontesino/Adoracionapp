import {
  applyXP,
  getLevelConfig,
  getLevelNumber,
  getLevelProgress,
  getXPToNextLevel,
} from '../levels'

describe('progress engine — levels', () => {
  describe('getLevelConfig', () => {
    it('returns level 1 at 0 XP', () => {
      expect(getLevelConfig(0).level).toBe(1)
      expect(getLevelConfig(0).name).toBe('Niño espiritual')
    })

    it('returns level 1 at 499 XP (boundary)', () => {
      expect(getLevelConfig(499).level).toBe(1)
    })

    it('returns level 2 at 500 XP (boundary)', () => {
      expect(getLevelConfig(500).level).toBe(2)
    })

    it('returns level 3 at 1500 XP', () => {
      expect(getLevelConfig(1500).level).toBe(3)
    })

    it('returns level 4 at 3500 XP', () => {
      expect(getLevelConfig(3500).level).toBe(4)
    })

    it('returns level 5 at 7000 XP', () => {
      expect(getLevelConfig(7000).level).toBe(5)
      expect(getLevelConfig(7000).name).toBe('Mentor espiritual')
    })

    it('returns level 5 for very high XP', () => {
      expect(getLevelConfig(999999).level).toBe(5)
    })
  })

  describe('getLevelNumber', () => {
    it('returns correct level number at each boundary', () => {
      expect(getLevelNumber(0)).toBe(1)
      expect(getLevelNumber(500)).toBe(2)
      expect(getLevelNumber(1500)).toBe(3)
      expect(getLevelNumber(3500)).toBe(4)
      expect(getLevelNumber(7000)).toBe(5)
    })
  })

  describe('getLevelProgress', () => {
    it('returns 0 at the start of a level', () => {
      expect(getLevelProgress(0)).toBe(0)
      expect(getLevelProgress(500)).toBe(0)
    })

    it('returns a fraction mid-level', () => {
      // Level 1: 0–499, range 499. At 250 XP: 250/499 ≈ 0.501
      const progress = getLevelProgress(250)
      expect(progress).toBeGreaterThan(0.4)
      expect(progress).toBeLessThan(0.6)
    })

    it('returns 1 at level 5 (max level, infinite ceiling)', () => {
      expect(getLevelProgress(7000)).toBe(1)
      expect(getLevelProgress(99999)).toBe(1)
    })

    it('never exceeds 1', () => {
      expect(getLevelProgress(498)).toBeLessThanOrEqual(1)
      expect(getLevelProgress(499)).toBeLessThanOrEqual(1)
    })
  })

  describe('getXPToNextLevel', () => {
    it('returns positive amount when not at max level', () => {
      const remaining = getXPToNextLevel(0)
      expect(remaining).toBe(500) // needs 500 to hit level 2
    })

    it('returns null at max level', () => {
      expect(getXPToNextLevel(7000)).toBeNull()
      expect(getXPToNextLevel(50000)).toBeNull()
    })
  })

  describe('applyXP', () => {
    it('adds XP without level up', () => {
      const result = applyXP(0, 1, 50)
      expect(result.newXP).toBe(50)
      expect(result.didLevelUp).toBe(false)
      expect(result.newLevel).toBe(1)
    })

    it('detects level up when threshold is crossed', () => {
      const result = applyXP(490, 1, 50) // 490+50=540, crosses level 2 at 500
      expect(result.newXP).toBe(540)
      expect(result.didLevelUp).toBe(true)
      expect(result.newLevel).toBe(2)
      expect(result.previousLevel).toBe(1)
    })

    it('handles already being at max level', () => {
      const result = applyXP(7000, 5, 500)
      expect(result.newXP).toBe(7500)
      expect(result.didLevelUp).toBe(false)
      expect(result.newLevel).toBe(5)
    })

    it('handles exact level boundary', () => {
      const result = applyXP(499, 1, 1) // exactly 500 = level 2
      expect(result.newXP).toBe(500)
      expect(result.didLevelUp).toBe(true)
      expect(result.newLevel).toBe(2)
    })
  })
})
