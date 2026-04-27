// Thresholds aligned with STAGES in src/features/progress/constants/stages.ts.
// level.name matches stage.visibleName so Firestore-stored level is always
// consistent with the UI display.
export const LEVELS = [
  { level: 1, key: 'baby',   name: 'Novato',      minXP: 0,    maxXP: 149      },
  { level: 2, key: 'child',  name: 'Aprendiz',    minXP: 150,  maxXP: 399      },
  { level: 3, key: 'young',  name: 'Servidor',    minXP: 400,  maxXP: 899      },
  { level: 4, key: 'adult',  name: 'Discípulo',   minXP: 900,  maxXP: 1599     },
  { level: 5, key: 'master', name: 'Líder',       minXP: 1600, maxXP: Infinity },
] as const

export const XP_REWARDS = {
  habit_completed: 50,
  prayer_offered: 25,
  sermon_watched: 75,
  streak_milestone: 100,
  onboarding_complete: 200,
  challenge_completed: 150,
} as const

export const PAGINATION = {
  sermons: 20,
  messages: 15,
  announcements: 10,
  prayerRequests: 25,
  posts: 30,
} as const
