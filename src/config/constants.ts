export const LEVELS = [
  { level: 1, name: 'Niño espiritual',        minXP: 0,    maxXP: 499    },
  { level: 2, name: 'Adolescente espiritual', minXP: 500,  maxXP: 1499   },
  { level: 3, name: 'Joven espiritual',       minXP: 1500, maxXP: 3499   },
  { level: 4, name: 'Maduro espiritual',      minXP: 3500, maxXP: 6999   },
  { level: 5, name: 'Mentor espiritual',      minXP: 7000, maxXP: Infinity },
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
