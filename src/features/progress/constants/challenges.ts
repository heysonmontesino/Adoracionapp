import type { ChallengeDefinition, StreakBonus } from '../types'

// ─── Retos diarios ────────────────────────────────────────────────────────────

export const DAILY_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'daily-bible',
    frequency: 'daily',
    title: 'Leer la Biblia',
    description: 'Lee al menos 1 capítulo completo',
    xp: 10,
    rule: 'Mínimo 1 capítulo completo',
  },
  {
    id: 'daily-pray',
    frequency: 'daily',
    title: 'Orar al levantarte',
    description: 'Dedica tus primeros minutos a hablar con Dios',
    xp: 10,
    rule: 'Oración al iniciar el día',
  },
  {
    id: 'daily-gratitude',
    frequency: 'daily',
    title: 'Agradecer',
    description: 'Menciona al menos 2 razones de gratitud',
    xp: 10,
    rule: 'Al menos 2 razones de gratitud',
  },
]

// Bonus por completar los 3 retos diarios en el mismo día
export const DAILY_COMPLETE_BONUS_XP = 20

// ─── Retos semanales para Novato, Aprendiz, Servidor (1 slot, 30 XP c/u) ──

export const WEEKLY_CHALLENGES_JUNIOR: ChallengeDefinition[] = [
  {
    id: 'wk-j-fast',
    frequency: 'weekly',
    title: 'Ayunar 1 comida',
    description: 'Ayuna una comida durante esta semana',
    xp: 30,
  },
  {
    id: 'wk-j-extra-chapter',
    frequency: 'weekly',
    title: 'Capítulo adicional',
    description: 'Lee un capítulo fuera del plan diario',
    xp: 30,
  },
  {
    id: 'wk-j-sermon',
    frequency: 'weekly',
    title: 'Escuchar una prédica',
    description: 'Escucha una prédica entre semana',
    xp: 30,
  },
  {
    id: 'wk-j-serve',
    frequency: 'weekly',
    title: 'Servir a alguien',
    description: 'Realiza una acción práctica de servicio',
    xp: 30,
  },
  {
    id: 'wk-j-encourage',
    frequency: 'weekly',
    title: 'Palabra de ánimo',
    description: 'Envía una palabra de ánimo a alguien',
    xp: 30,
  },
]

// ─── Retos semanales para Discípulo, Líder (2 slots, 35 XP c/u) ────────────

export const WEEKLY_CHALLENGES_SENIOR: ChallengeDefinition[] = [
  {
    id: 'wk-s-fast-half',
    frequency: 'weekly',
    title: 'Ayunar media jornada',
    description: 'Ayuna media jornada esta semana',
    xp: 35,
  },
  {
    id: 'wk-s-psalm',
    frequency: 'weekly',
    title: 'Salmo adicional',
    description: 'Lee un Salmo extra y medítalo',
    xp: 35,
  },
  {
    id: 'wk-s-concrete-serve',
    frequency: 'weekly',
    title: 'Obra concreta',
    description: 'Realiza una obra concreta de servicio',
    xp: 35,
  },
  {
    id: 'wk-s-forgive',
    frequency: 'weekly',
    title: 'Pedir perdón',
    description: 'Pide perdón a una persona esta semana',
    xp: 35,
  },
  {
    id: 'wk-s-share-word',
    frequency: 'weekly',
    title: 'Compartir lo que Dios te habló',
    description: 'Comparte con alguien lo que Dios te habló',
    xp: 35,
  },
  {
    id: 'wk-s-devotional',
    frequency: 'weekly',
    title: 'Devocional extra',
    description: 'Escucha un devocional extra y anótalo',
    xp: 35,
  },
]

// ─── Retos mensuales (1 rotativo para todos, 60 XP c/u) ──────────────────────

export const MONTHLY_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'mo-evangelize',
    frequency: 'monthly',
    title: 'Hablarle a alguien de Cristo',
    description: 'Comparte el evangelio con alguien este mes',
    xp: 60,
  },
  {
    id: 'mo-bible-book',
    frequency: 'monthly',
    title: 'Leer un libro corto de la Biblia',
    description: 'Lee un libro corto completo de la Biblia',
    xp: 60,
  },
  {
    id: 'mo-church-serve',
    frequency: 'monthly',
    title: 'Servir en la iglesia',
    description: 'Participa en un servicio o actividad de la iglesia',
    xp: 60,
  },
  {
    id: 'mo-give',
    frequency: 'monthly',
    title: 'Dar a quien lo necesita',
    description: 'Ayuda económicamente o con bienes a alguien',
    xp: 60,
  },
]

// ─── Bonus por racha ──────────────────────────────────────────────────────────

export const STREAK_BONUSES: StreakBonus[] = [
  { days: 7,  xp: 100 },
  { days: 30, xp: 500 },
]
