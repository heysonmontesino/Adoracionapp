export const LEVELS = [
  { level: 1, name: 'Niño espiritual',        minXP: 0,    maxXP: 499    },
  { level: 2, name: 'Adolescente espiritual', minXP: 500,  maxXP: 1499   },
  { level: 3, name: 'Joven espiritual',       minXP: 1500, maxXP: 3499   },
  { level: 4, name: 'Maduro espiritual',      minXP: 3500, maxXP: 6999   },
  { level: 5, name: 'Mentor espiritual',      minXP: 7000, maxXP: Infinity },
] as const

export const PAGINATION = {
  sermons: 10,
  messages: 20,
  prayerRequests: 15,
  posts: 20,
} as const
