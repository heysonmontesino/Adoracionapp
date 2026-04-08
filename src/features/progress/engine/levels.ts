import { LEVELS } from '../../../config/constants'
import type { LevelConfig, LevelUpResult } from '../types'

export function getLevelConfig(xp: number): LevelConfig {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i] as LevelConfig
    }
  }
  return LEVELS[0] as LevelConfig
}

export function getLevelNumber(xp: number): 1 | 2 | 3 | 4 | 5 {
  return getLevelConfig(xp).level
}

// Returns XP progress within current level as 0–1
export function getLevelProgress(xp: number): number {
  const config = getLevelConfig(xp)
  if (config.maxXP === Infinity) return 1
  const rangeXP = config.maxXP - config.minXP
  const earnedInLevel = xp - config.minXP
  return Math.min(earnedInLevel / rangeXP, 1)
}

// Returns XP remaining to reach next level, or null if already max
export function getXPToNextLevel(xp: number): number | null {
  const config = getLevelConfig(xp)
  if (config.maxXP === Infinity) return null
  return config.maxXP - xp + 1
}

export function applyXP(
  currentXP: number,
  currentLevel: 1 | 2 | 3 | 4 | 5,
  xpToAdd: number,
): LevelUpResult & { newXP: number } {
  const newXP = currentXP + xpToAdd
  const previousLevel = currentLevel
  const newLevel = getLevelNumber(newXP)
  return {
    newXP,
    previousLevel,
    newLevel,
    didLevelUp: newLevel > previousLevel,
  }
}
