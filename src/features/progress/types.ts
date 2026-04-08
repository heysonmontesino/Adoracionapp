import { FirestoreTimestampValue } from '../../shared/types/firestore'

// ─── XP Events (append-only log) ────────────────────────────────────────────

export type XPEventType =
  | 'habit_completed'
  | 'prayer_offered'
  | 'sermon_watched'
  | 'streak_milestone'
  | 'onboarding_complete'
  | 'challenge_completed'

export interface XPEvent {
  id: string
  userId: string
  type: XPEventType
  xpAwarded: number
  sourceId: string | null
  dateKey: string              // 'YYYY-MM-DD'
  metadata: Record<string, unknown>
  createdAt: FirestoreTimestampValue
}

// ─── Habits ─────────────────────────────────────────────────────────────────

export interface Habit {
  id: string
  name: string
  xpReward: number
  active: boolean
  createdAt: FirestoreTimestampValue
}

export interface HabitCompletion {
  id: string                   // format: {habitId}_{YYYY-MM-DD}
  habitId: string
  dateKey: string              // 'YYYY-MM-DD'
  completedAt: FirestoreTimestampValue
  xpAwarded: number
}

export interface CreateHabitInput {
  name: string
  xpReward: number
}

// ─── Engine types (pure, no Firebase) ───────────────────────────────────────

export interface LevelConfig {
  level: 1 | 2 | 3 | 4 | 5
  name: string
  minXP: number
  maxXP: number
}

export interface StreakResult {
  streakDays: number
  longestStreak: number
  isNewDay: boolean
  isStreakBroken: boolean
}

export interface LevelUpResult {
  previousLevel: number
  newLevel: number
  didLevelUp: boolean
}

// ─── Progress summary (read from user doc) ───────────────────────────────────

export interface ProgressSnapshot {
  xp: number
  level: 1 | 2 | 3 | 4 | 5
  streakDays: number
  longestStreak: number
  lastActivityDate: string
  totalPrayersOffered: number
}
