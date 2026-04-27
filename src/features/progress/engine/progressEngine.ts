// ─── Motor de progresión espiritual — funciones puras ────────────────────────
// Sin efectos laterales. Sin dependencias de UI. Fácil de testear.

import { STAGES } from '../constants/stages'
import {
  WEEKLY_CHALLENGES_JUNIOR,
  WEEKLY_CHALLENGES_SENIOR,
  MONTHLY_CHALLENGES,
  STREAK_BONUSES,
} from '../constants/challenges'
import type {
  StageDefinition,
  ChallengeDefinition,
  UserProgressSnapshot,
} from '../types/index'

// ─── Etapa actual según XP ────────────────────────────────────────────────────

export function getStageByXP(xp: number): StageDefinition {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (xp >= STAGES[i].xpMin) return STAGES[i]
  }
  return STAGES[0]
}

// ─── Siguiente etapa ──────────────────────────────────────────────────────────

export function getNextStage(current: StageDefinition): StageDefinition | null {
  return STAGES.find((s) => s.id === current.id + 1) ?? null
}

// ─── XP faltante para siguiente etapa ────────────────────────────────────────
// Retorna null si el usuario ya está en Mentor (sin techo)

export function getXPToNextStage(
  xp: number,
  current: StageDefinition
): number | null {
  if (current.xpMax === null) return null
  return current.xpMax + 1 - xp
}

// ─── Porcentaje de progreso dentro de la etapa actual ────────────────────────

export function getProgressPctInStage(
  xp: number,
  current: StageDefinition
): number {
  if (current.xpMax === null) return 1
  const range = current.xpMax - current.xpMin + 1
  const earned = xp - current.xpMin
  return Math.min(Math.max(earned / range, 0), 1)
}

// ─── XP ganado por racha ──────────────────────────────────────────────────────
// Retorna el bonus más alto alcanzado (no acumulativo)

export function getStreakBonusXP(streakDays: number): number {
  let bonus = 0
  for (const b of STREAK_BONUSES) {
    if (streakDays >= b.days) bonus = b.xp
  }
  return bonus
}

// ─── Retos semanales asignados según etapa ────────────────────────────────────
// weekSeed: número de semana del año (0–51). Rota el catálogo.

export function getWeeklyChallenges(
  stage: StageDefinition,
  weekSeed: number
): ChallengeDefinition[] {
  const pool =
    stage.id >= 4 ? WEEKLY_CHALLENGES_SENIOR : WEEKLY_CHALLENGES_JUNIOR
  const slots = stage.weeklySlots
  const start = weekSeed % pool.length
  const result: ChallengeDefinition[] = []
  for (let i = 0; i < slots; i++) {
    result.push(pool[(start + i) % pool.length])
  }
  return result
}

// ─── Reto mensual rotativo ────────────────────────────────────────────────────
// monthSeed: número de mes (0–11).

export function getMonthlyChallenge(monthSeed: number): ChallengeDefinition {
  return MONTHLY_CHALLENGES[monthSeed % MONTHLY_CHALLENGES.length]
}

// ─── Semilla de semana del año (helper) ──────────────────────────────────────

export function getWeekSeed(now: Date = new Date()): number {
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.floor(
    (now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)
  )
}

// ─── Snapshot completo de progresión ─────────────────────────────────────────
// Punto de entrada principal para la UI y tests de integración.

export function buildProgressSnapshot(
  xp: number,
  streakDays: number,
  now: Date = new Date()
): UserProgressSnapshot {
  const stage = getStageByXP(xp)
  const nextStage = getNextStage(stage)
  const xpToNextStage = getXPToNextStage(xp, stage)
  const progressPctInStage = getProgressPctInStage(xp, stage)
  const streakBonusXp = getStreakBonusXP(streakDays)
  const activeWeeklyChallenges = getWeeklyChallenges(stage, getWeekSeed(now))
  const activeMonthlyChallenge = getMonthlyChallenge(now.getMonth())

  return {
    xp,
    streakDays,
    stage,
    nextStage,
    xpToNextStage,
    progressPctInStage,
    streakBonusXp,
    activeWeeklyChallenges,
    activeMonthlyChallenge,
  }
}
