import { orderBy, where } from 'firebase/firestore'
import {
  addDocument,
  executeTransaction,
  generateDocId,
  getDocument,
  queryDocuments,
  updateDocument,
  Timestamp,
} from '../../services/firebase/firestore'
import { getTodayDateKey } from './engine/streaks'
import { applyXP } from './engine/levels'
import { updateStreak, isStreakMilestone } from './engine/streaks'
import { getXPReward, buildHabitCompletionId } from './engine/xp'
import type { ProgressSnapshot, Habit, HabitCompletion, XPEventType, CreateHabitInput } from './types'

// ─── Collection paths ────────────────────────────────────────────────────────

function userPath(uid: string) { return `users/${uid}` }
function habitsPath(uid: string) { return `users/${uid}/habits` }
function completionsPath(uid: string) { return `users/${uid}/habit-completions` }
const XP_EVENTS_COLLECTION = 'xp-events'

// ─── Progress snapshot ────────────────────────────────────────────────────────

export async function fetchProgressSnapshot(uid: string): Promise<ProgressSnapshot | null> {
  const user = await getDocument<{ progress: ProgressSnapshot }>(userPath(uid))
  return user?.progress ?? null
}

// ─── XP Events (append-only) ─────────────────────────────────────────────────

export async function writeXPEvent(
  uid: string,
  type: XPEventType,
  xpAwarded: number,
  sourceId: string | null = null,
  metadata: Record<string, unknown> = {},
): Promise<string> {
  return addDocument(XP_EVENTS_COLLECTION, {
    userId: uid,
    type,
    xpAwarded,
    sourceId,
    dateKey: getTodayDateKey(),
    metadata,
    createdAt: Timestamp.now(),
  })
}

// ─── User progress update ─────────────────────────────────────────────────────

export async function updateUserProgress(
  uid: string,
  current: ProgressSnapshot,
  xpToAdd: number,
): Promise<{ updated: ProgressSnapshot; didLevelUp: boolean; isStreakMilestone: boolean }> {
  const today = getTodayDateKey()

  const { newXP, newLevel, didLevelUp } = applyXP(current.xp, current.level, xpToAdd)
  const streakResult = updateStreak(
    current.lastActivityDate,
    current.streakDays,
    current.longestStreak,
    today,
  )

  const updated: ProgressSnapshot = {
    xp: newXP,
    level: newLevel,
    streakDays: streakResult.streakDays,
    longestStreak: streakResult.longestStreak,
    lastActivityDate: streakResult.isNewDay ? today : current.lastActivityDate,
    totalPrayersOffered: current.totalPrayersOffered,
  }

  await updateDocument(userPath(uid), { progress: updated })

  const milestoneHit = streakResult.isNewDay && isStreakMilestone(streakResult.streakDays)

  return { updated, didLevelUp, isStreakMilestone: milestoneHit }
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export async function fetchHabits(uid: string): Promise<Habit[]> {
  return queryDocuments<Habit>(
    habitsPath(uid),
    where('active', '==', true),
    orderBy('createdAt', 'asc'),
  )
}

export async function createHabit(
  uid: string,
  input: CreateHabitInput,
): Promise<string> {
  return addDocument(habitsPath(uid), {
    name: input.name,
    xpReward: input.xpReward,
    active: true,
    createdAt: Timestamp.now(),
  })
}

export async function archiveHabit(uid: string, habitId: string): Promise<void> {
  await updateDocument(`${habitsPath(uid)}/${habitId}`, { active: false })
}

// ─── Habit completions ────────────────────────────────────────────────────────

export async function fetchTodayCompletions(uid: string): Promise<HabitCompletion[]> {
  const today = getTodayDateKey()
  return queryDocuments<HabitCompletion>(
    completionsPath(uid),
    where('dateKey', '==', today),
  )
}

export async function isHabitCompletedToday(
  uid: string,
  habitId: string,
): Promise<boolean> {
  const today = getTodayDateKey()
  const id = buildHabitCompletionId(habitId, today)
  const doc = await getDocument(`${completionsPath(uid)}/${id}`)
  return doc !== null
}

// Returns null if already completed today (idempotent).
// All three writes (completion, xp-event, user.progress) are atomic via runTransaction.
export async function completeHabit(
  uid: string,
  habitId: string,
  currentProgress: ProgressSnapshot,
): Promise<{ xpAwarded: number; didLevelUp: boolean; isStreakMilestone: boolean } | null> {
  const today = getTodayDateKey()
  const completionId = buildHabitCompletionId(habitId, today)
  // Pre-generate the xp-event ID outside the transaction (no I/O needed)
  const xpEventId = generateDocId(XP_EVENTS_COLLECTION)
  const xpAwarded = getXPReward('habit_completed')

  // Compute all progress changes before entering the transaction — pure, no I/O
  const { newXP, newLevel, didLevelUp } = applyXP(
    currentProgress.xp,
    currentProgress.level,
    xpAwarded,
  )
  const streakResult = updateStreak(
    currentProgress.lastActivityDate,
    currentProgress.streakDays,
    currentProgress.longestStreak,
    today,
  )
  const updatedProgress: ProgressSnapshot = {
    xp: newXP,
    level: newLevel,
    streakDays: streakResult.streakDays,
    longestStreak: streakResult.longestStreak,
    lastActivityDate: streakResult.isNewDay ? today : currentProgress.lastActivityDate,
    totalPrayersOffered: currentProgress.totalPrayersOffered,
  }
  const milestoneHit = streakResult.isNewDay && isStreakMilestone(streakResult.streakDays)

  return executeTransaction(async (tx) => {
    // Idempotent guard — inside the transaction, prevents double-tap race
    const existing = await tx.get(`${completionsPath(uid)}/${completionId}`)
    if (existing) return null

    tx.set(`${completionsPath(uid)}/${completionId}`, {
      id: completionId,
      habitId,
      dateKey: today,
      completedAt: Timestamp.now(),
      xpAwarded,
    })

    tx.set(`${XP_EVENTS_COLLECTION}/${xpEventId}`, {
      userId: uid,
      type: 'habit_completed' as const,
      xpAwarded,
      sourceId: habitId,
      dateKey: today,
      metadata: {},
      createdAt: Timestamp.now(),
    })

    tx.update(userPath(uid), { progress: updatedProgress })

    return { xpAwarded, didLevelUp, isStreakMilestone: milestoneHit }
  })
}
