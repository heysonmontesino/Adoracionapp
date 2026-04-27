import {
  applyXP,
  getLevelConfig,
  getLevelNumber,
  getLevelProgress,
  getXPToNextLevel,
} from '../levels'

// Thresholds after alignment with STAGES:
//   Novato    (1): 0   – 149
//   Aprendiz  (2): 150 – 399
//   Servidor  (3): 400 – 899
//   Discípulo (4): 900 – 1599
//   Líder     (5): 1600+

describe('progress engine — levels', () => {
  describe('getLevelConfig', () => {
    it('returns level 1 at 0 XP', () => {
      const config = getLevelConfig(0)
      expect(config.level).toBe(1)
      expect(config.key).toBe('baby')
      expect(config.name).toBe('Novato')
    })

    it('returns level 1 at 149 XP (upper boundary of Novato)', () => {
      expect(getLevelConfig(149).level).toBe(1)
    })

    it('returns level 2 at 150 XP (lower boundary of Aprendiz)', () => {
      expect(getLevelConfig(150).level).toBe(2)
    })

    it('returns level 3 at 400 XP (lower boundary of Servidor)', () => {
      expect(getLevelConfig(400).level).toBe(3)
      expect(getLevelConfig(400).key).toBe('young')
    })

    it('returns level 4 at 900 XP (lower boundary of Discípulo)', () => {
      expect(getLevelConfig(900).level).toBe(4)
      expect(getLevelConfig(900).key).toBe('adult')
    })

    it('returns level 5 at 1600 XP (lower boundary of Líder)', () => {
      const config = getLevelConfig(1600)
      expect(config.level).toBe(5)
      expect(config.key).toBe('master')
      expect(config.name).toBe('Líder')
    })

    it('returns level 5 for very high XP', () => {
      expect(getLevelConfig(999999).level).toBe(5)
    })
  })

  describe('getLevelNumber', () => {
    it('returns correct level number at each boundary', () => {
      expect(getLevelNumber(0)).toBe(1)
      expect(getLevelNumber(150)).toBe(2)
      expect(getLevelNumber(400)).toBe(3)
      expect(getLevelNumber(900)).toBe(4)
      expect(getLevelNumber(1600)).toBe(5)
    })
  })

  describe('getLevelProgress', () => {
    it('returns 0 at the start of level 1', () => {
      expect(getLevelProgress(0)).toBe(0)
    })

    it('returns 0 at the start of level 2', () => {
      expect(getLevelProgress(150)).toBe(0)
    })

    it('returns ~0.5 mid-way through level 1 (Novato: 0–149, range 150)', () => {
      // At xp=75: earned=75, range=150, pct=0.5
      const progress = getLevelProgress(75)
      expect(progress).toBeCloseTo(0.5, 1)
    })

    it('returns 1 at level 5 (Líder, infinite ceiling)', () => {
      expect(getLevelProgress(1600)).toBe(1)
      expect(getLevelProgress(99999)).toBe(1)
    })

    it('never exceeds 1', () => {
      expect(getLevelProgress(148)).toBeLessThanOrEqual(1)
      expect(getLevelProgress(149)).toBeLessThanOrEqual(1)
    })
  })

  describe('getXPToNextLevel', () => {
    it('returns 150 from 0 XP (needs 150 to reach Aprendiz)', () => {
      expect(getXPToNextLevel(0)).toBe(150)
    })

    it('returns null at max level (Líder)', () => {
      expect(getXPToNextLevel(1600)).toBeNull()
      expect(getXPToNextLevel(50000)).toBeNull()
    })
  })

  describe('applyXP', () => {
    it('adds XP without level up when staying in Novato', () => {
      const result = applyXP(0, 1, 50)
      expect(result.newXP).toBe(50)
      expect(result.didLevelUp).toBe(false)
      expect(result.newLevel).toBe(1)
    })

    it('detects level up from Novato to Aprendiz when threshold is crossed', () => {
      // 140 + 20 = 160, crosses level 2 at 150
      const result = applyXP(140, 1, 20)
      expect(result.newXP).toBe(160)
      expect(result.didLevelUp).toBe(true)
      expect(result.newLevel).toBe(2)
      expect(result.previousLevel).toBe(1)
    })

    it('handles already being at max level (Líder)', () => {
      const result = applyXP(1600, 5, 500)
      expect(result.newXP).toBe(2100)
      expect(result.didLevelUp).toBe(false)
      expect(result.newLevel).toBe(5)
    })

    it('handles exact level boundary: 149 + 1 = 150 → Aprendiz', () => {
      const result = applyXP(149, 1, 1)
      expect(result.newXP).toBe(150)
      expect(result.didLevelUp).toBe(true)
      expect(result.newLevel).toBe(2)
    })
  })
})
