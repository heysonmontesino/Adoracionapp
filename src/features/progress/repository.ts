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
import type { CharacterGender, SpiritualStage } from '../character/types'

// ─── Collection paths ────────────────────────────────────────────────────────

function userPath(uid: string) { return `users/${uid}` }
function habitsPath(uid: string) { return `users/${uid}/habits` }
function completionsPath(uid: string) { return `users/${uid}/habit-completions` }
const XP_EVENTS_COLLECTION = 'xp-events'

// ─── Progress snapshot ────────────────────────────────────────────────────────

function buildDefaultProgressSnapshot(): ProgressSnapshot {
  return {
    xp: 0,
    level: 1,
    streakDays: 0,
    longestStreak: 0,
    lastActivityDate: getTodayDateKey(),
    totalPrayersOffered: 0,
  }
}

function normalizeGender(value: unknown): CharacterGender | undefined {
  if (value === 'male' || value === 'man' || value === 'boy') return 'male'
  if (value === 'female' || value === 'woman' || value === 'girl') return 'female'
  return undefined
}

function normalizeStageOverride(value: unknown): SpiritualStage | number | undefined {
  if (
    value === 'baby' ||
    value === 'child' ||
    value === 'young' ||
    value === 'adult' ||
    value === 'master'
  ) {
    return value
  }

  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5) {
    return value
  }

  return undefined
}

function normalizeLevel(value: unknown): ProgressSnapshot['level'] {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
    ? value as ProgressSnapshot['level']
    : 1
}

export async function fetchProgressSnapshot(uid: string): Promise<ProgressSnapshot> {
  const user = await getDocument<{ 
    progress?: Partial<ProgressSnapshot>; 
    character?: { 
      stageOverride?: unknown;
      genderOverride?: unknown;
      gender?: unknown;
    } 
  }>(userPath(uid))
  
  if (!user) return buildDefaultProgressSnapshot()

  // Inicialización de valores por defecto si el documento existe pero el progreso está vacío
  if (user.progress !== undefined && typeof user.progress?.xp !== 'number') {
    console.warn(
      '[Progress] Firestore user document exists but progress.xp is undefined. Check Firestore structure.',
      { progressKeys: Object.keys(user.progress || {}) }
    )
  }

  const progress: ProgressSnapshot = {
    xp: typeof user.progress?.xp === 'number' ? Math.max(0, user.progress.xp) : 0,
    level: normalizeLevel(user.progress?.level),
    streakDays: typeof user.progress?.streakDays === 'number' ? Math.max(0, user.progress.streakDays) : 0,
    longestStreak: typeof user.progress?.longestStreak === 'number' ? Math.max(0, user.progress.longestStreak) : 0,
    lastActivityDate: user.progress?.lastActivityDate ?? getTodayDateKey(),
    totalPrayersOffered: typeof user.progress?.totalPrayersOffered === 'number' ? Math.max(0, user.progress.totalPrayersOffered) : 0,
  }

  return {
    ...progress,
    stageOverride: normalizeStageOverride(user.character?.stageOverride),
    genderOverride: normalizeGender(user.character?.genderOverride ?? user.character?.gender)
  }
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


/**
 * QA ONLY: Persiste un override visual para el nivel espiritual.
 * No afecta el XP real ni las métricas de progreso de dominio.
 */
export async function updateCharacterOverride(
  uid: string,
  overrides: { stage?: SpiritualStage | number | null; gender?: CharacterGender | null }
): Promise<void> {
  const updates: Record<string, any> = {}
  
  if (overrides.stage !== undefined) {
    updates['character.stageOverride'] = overrides.stage
  }
  if (overrides.gender !== undefined) {
    updates['character.genderOverride'] = overrides.gender
  }

  if (Object.keys(updates).length > 0) {
    await updateDocument(userPath(uid), updates)
  }
}

/**
 * INCREMENTO ATÓMICO: Esta es la UNICA forma segura de actualizar el XP.
 * No depende de lo que la UI crea que es el XP actual; lee el valor real del servidor
 * dentro de una transacción para evitar resets a 0.
 */
/**
 * INCREMENTO ATÓMICO E IDEMPOTENTE: UNICA forma segura de actualizar el XP.
 * Si se proporciona un sourceId, se usa para generar un ID determinista del evento de auditoría,
 * evitando que la misma acción otorgue XP dos veces si se dispara repetidamente o desde varios dispositivos.
 */
export async function incrementUserXP(
  uid: string,
  xpToAdd: number,
  type: XPEventType,
  sourceId: string | null = null,
  forceIdempotencyId: string | null = null,
  metadata: Record<string, unknown> = {}
): Promise<{ updated: ProgressSnapshot; didLevelUp: boolean; isNewDay: boolean }> {
  return executeTransaction(async (tx) => {
    return _internalIncrementUserXP(tx, uid, xpToAdd, type, sourceId, forceIdempotencyId, metadata)
  })
}

/**
 * Lógica interna compartida para incrementos de XP dentro de transacciones.
 */
export async function _internalIncrementUserXP(
  tx: any,
  uid: string,
  xpToAdd: number,
  type: XPEventType,
  sourceId: string | null = null,
  forceIdempotencyId: string | null = null,
  metadata: Record<string, unknown> = {}
): Promise<{ updated: ProgressSnapshot; didLevelUp: boolean; isNewDay: boolean }> {
  console.log(`[_internalIncrementUserXP] Start for uid: ${uid}, xp: ${xpToAdd}, type: ${type}`);
  const today = getTodayDateKey()
  const auditPrefix = xpToAdd >= 0 ? 'grant' : 'revoke'
  const xpEventId = forceIdempotencyId || (sourceId 
      ? `${auditPrefix}_${type}_${sourceId}_${today}` 
      : generateDocId(XP_EVENTS_COLLECTION))

  // 1. Verificar si este evento específico ya se procesó (Idempotencia)
  if (forceIdempotencyId) {
    try {
      console.log(`[_internalIncrementUserXP] Checking idempotency: ${XP_EVENTS_COLLECTION}/${forceIdempotencyId}`);
      const existingEvent = await tx.get(`${XP_EVENTS_COLLECTION}/${forceIdempotencyId}`)
      if (existingEvent) {
        console.log(`[_internalIncrementUserXP] Event already exists. Skipping.`);
        const userDoc = await tx.get(userPath(uid)) as { progress?: ProgressSnapshot } | null
        return { 
          updated: userDoc?.progress || { xp: 0, level: 1, streakDays: 0, longestStreak: 0, lastActivityDate: today, totalPrayersOffered: 0 },
          didLevelUp: false,
          isNewDay: false
        }
      }
    } catch (error) {
      console.error(`[_internalIncrementUserXP] Error checking idempotency:`, error);
      throw error; // Re-throw to fail transaction and see it in UI
    }
  }

  console.log(`[_internalIncrementUserXP] Fetching user progress: ${userPath(uid)}`);
  const userDoc = await tx.get(userPath(uid)) as { progress?: ProgressSnapshot } | null
  const current: ProgressSnapshot = userDoc?.progress || {
    xp: 0, level: 1, streakDays: 0, longestStreak: 0, lastActivityDate: today, totalPrayersOffered: 0
  }

  const { newXP, newLevel, didLevelUp } = applyXP(current.xp, current.level, xpToAdd)
  const streakResult = updateStreak(current.lastActivityDate, current.streakDays, current.longestStreak, today)
  
  const finalXP = Math.max(0, newXP)
  const updated: ProgressSnapshot = {
    xp: finalXP,
    level: normalizeLevel(newLevel),
    streakDays: streakResult.streakDays,
    longestStreak: streakResult.longestStreak,
    lastActivityDate: streakResult.isNewDay ? today : (current.lastActivityDate || today),
    totalPrayersOffered: (current.totalPrayersOffered || 0) + (type === 'prayer_offered' ? 1 : 0)
  }

  console.log(`[_internalIncrementUserXP] Applying updates. New XP: ${finalXP}`);
  console.log(`[_internalIncrementUserXP] SET xp-event: ${XP_EVENTS_COLLECTION}/${xpEventId}`, { type, xpAwarded: xpToAdd });
  // Guardar evento de auditoría
  tx.set(`${XP_EVENTS_COLLECTION}/${xpEventId}`, {
    userId: uid,
    type,
    xpAwarded: xpToAdd,
    sourceId,
    dateKey: today,
    metadata: { ...metadata, previousXP: current.xp, finalXP },
    createdAt: Timestamp.now(),
  })

  console.log(`[_internalIncrementUserXP] Writing to user: ${userPath(uid)}`, { progress: updated });
  // Actualizar usuario
  tx.update(userPath(uid), { progress: updated })

  return { updated, didLevelUp, isNewDay: streakResult.isNewDay }
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

// ─── Challenge completions (Persistent in Firestore) ──────────────────────────

function challengesPath(uid: string) { return `users/${uid}/challenge-completions` }

export async function fetchChallengeCompletions(uid: string): Promise<Record<string, boolean>> {
  const snapshot = await queryDocuments<any>(challengesPath(uid))
  const completions: Record<string, boolean> = {}
  snapshot.forEach(doc => {
    completions[doc.id] = true
  })
  return completions
}

export async function toggleChallenge(
  uid: string,
  challengeId: string,
  frequency: string,
  xp: number,
  isDone: boolean,
  completionKey: string // LLave determinista: {freq}_{period}_{id}
): Promise<{ updated: ProgressSnapshot; didLevelUp: boolean; isNewDay: boolean }> {
  console.log(`[toggleChallenge] Starting for ${challengeId}, isDone: ${isDone}, key: ${completionKey}`);
  return executeTransaction(async (tx) => {
    const completionPath = `${challengesPath(uid)}/${completionKey}`
    console.log(`[toggleChallenge] Getting existing completion: ${completionPath}`);
    const existingCompletion = await tx.get(completionPath)

    // Idempotencia: Si el estado ya es el deseado, no hacer nada
    if (isDone === !!existingCompletion) {
      console.log(`[toggleChallenge] State already matches: ${isDone}. Skipping.`);
      const userDoc = await tx.get(userPath(uid)) as { progress?: ProgressSnapshot } | null
      return { 
        updated: userDoc?.progress || { xp: 0, level: 1, streakDays: 0, longestStreak: 0, lastActivityDate: getTodayDateKey(), totalPrayersOffered: 0 },
        didLevelUp: false,
        isNewDay: false
      }
    }

    // 1. Actualizar el XP de forma atómica
    // Generamos un ID de evento único para esta acción de toggle para permitir re-completar
    const actionId = `${completionKey}_${isDone ? 'done' : 'undone'}_${Date.now()}`
    console.log(`[toggleChallenge] Calling _internalIncrementUserXP with actionId: toggle_${actionId}`);
    const result = await _internalIncrementUserXP(
      tx,
      uid, 
      isDone ? xp : -xp, 
      'challenge_completed', 
      challengeId,
      `toggle_${actionId}`,
      { frequency, completionKey }
    )

    // 2. Persistir el estado de completado en el documento dedicado
    if (isDone) {
      console.log(`[toggleChallenge] SET completion: ${completionPath}`);
      tx.set(completionPath, {
        challengeId,
        frequency,
        completedAt: Timestamp.now(),
        xpAwarded: xp,
      })
    } else {
      console.log(`[toggleChallenge] DELETE completion: ${completionPath}`);
      tx.delete(completionPath)
    }

    console.log(`[toggleChallenge] Success!`);
    return result
  })
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
): Promise<{ xpAwarded: number; didLevelUp: boolean; isStreakMilestone: boolean; updated: ProgressSnapshot } | null> {
  const today = getTodayDateKey()
  const completionId = buildHabitCompletionId(habitId, today)
  const xpAwarded = getXPReward('habit_completed')

  return executeTransaction(async (tx) => {
    // 1. Idempotencia: Verificar si ya existe el completado
    const completionPath = `${completionsPath(uid)}/${completionId}`
    const existing = await tx.get(completionPath)
    if (existing) return null

    // 2. Registrar el completado
    tx.set(completionPath, {
      id: completionId, 
      habitId, 
      dateKey: today, 
      completedAt: Timestamp.now(), 
      xpAwarded
    })

    // 3. Incrementar XP usando la lógica unificada
    // Esto maneja auditoría, niveles y racha
    const result = await _internalIncrementUserXP(
      tx,
      uid,
      xpAwarded,
      'habit_completed',
      habitId,
      `grant_habit_${completionId}` // Idempotencia determinista
    )

    // 4. Calcular si es hito de racha
    const milestoneHit = result.isNewDay && isStreakMilestone(result.updated.streakDays)

    return {
      xpAwarded,
      didLevelUp: result.didLevelUp,
      isStreakMilestone: milestoneHit,
      updated: result.updated,
    }
  })
}
