// ─── Tipos base del sistema de progresión espiritual ─────────────────────────

export type InternalStageName =
  | 'Bebé espiritual'
  | 'Niño espiritual'
  | 'Joven espiritual'
  | 'Adulto espiritual'
  | 'Maestro espiritual'

export type VisibleStageName =
  | 'Novato'
  | 'Aprendiz'
  | 'Servidor'
  | 'Discípulo'
  | 'Líder'

// stageVisualKey — clave semántica para conectar assets de personaje en el futuro.
// Codex puede usar esto para asociar sprites/animaciones sin tocar la lógica.
export type CharacterStage = 'baby' | 'child' | 'young' | 'adult' | 'master'

export type ChallengeFrequency = 'daily' | 'weekly' | 'monthly'

export interface StageDefinition {
  id: number                          // 1–5
  internalName: InternalStageName
  visibleName: VisibleStageName       // nombre visible al usuario
  xpMin: number
  xpMax: number | null                // null = Mentor (sin techo)
  stageVisualKey: CharacterStage      // ← hook para personaje visual futuro
  characterStage: CharacterStage      // alias semántico para claridad en Codex
  weeklySlots: number                 // 1 para Neófito/Aprendiz/Discípulo, 2 para Consagrado/Mentor
  weeklyXpPerChallenge: number        // 30 ó 35
  phrase: string                      // frase pastoral de la etapa
}

export interface ChallengeDefinition {
  id: string
  frequency: ChallengeFrequency
  title: string
  description: string
  xp: number
  rule?: string
}

export interface StreakBonus {
  days: number
  xp: number
}

// Snapshot del estado de progresión de un usuario
export interface UserProgressSnapshot {
  xp: number
  streakDays: number
  stage: StageDefinition
  nextStage: StageDefinition | null
  xpToNextStage: number | null         // null si ya es Mentor
  progressPctInStage: number           // 0–1
  streakBonusXp: number                // XP ganado por racha actual
  activeWeeklyChallenges: ChallengeDefinition[]
  activeMonthlyChallenge: ChallengeDefinition
}
