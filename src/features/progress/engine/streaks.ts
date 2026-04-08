import type { StreakResult } from '../types'

// dateKey format: 'YYYY-MM-DD'
function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime()
  const msB = new Date(b).getTime()
  return Math.round(Math.abs(msA - msB) / (1000 * 60 * 60 * 24))
}

export function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0]
}

export function updateStreak(
  lastActivityDate: string,
  currentStreak: number,
  longestStreak: number,
  todayDateKey: string = getTodayDateKey(),
): StreakResult {
  const diff = daysBetween(lastActivityDate, todayDateKey)

  // Already logged today — no change
  if (diff === 0) {
    return {
      streakDays: currentStreak,
      longestStreak,
      isNewDay: false,
      isStreakBroken: false,
    }
  }

  // Consecutive day — increment
  if (diff === 1) {
    const newStreak = currentStreak + 1
    return {
      streakDays: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      isNewDay: true,
      isStreakBroken: false,
    }
  }

  // Gap of 2+ days — streak broken, restart at 1
  return {
    streakDays: 1,
    longestStreak,
    isNewDay: true,
    isStreakBroken: true,
  }
}

export function isStreakMilestone(streakDays: number): boolean {
  return [3, 7, 14, 30, 60, 90, 180, 365].includes(streakDays)
}
