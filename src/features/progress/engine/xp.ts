import { XP_REWARDS } from '../../../config/constants'
import type { XPEventType } from '../types'

export function getXPReward(eventType: XPEventType): number {
  return XP_REWARDS[eventType] ?? 0
}

export function buildHabitCompletionId(habitId: string, dateKey: string): string {
  return `${habitId}_${dateKey}`
}
