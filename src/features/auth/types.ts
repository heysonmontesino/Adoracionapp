export type UserRole = 'member' | 'leader' | 'pastor' | 'admin'
export type UserStatus = 'active' | 'blocked'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
  lastLoginAt: string
  onboardingCompleted: boolean
  selectedChurchCampus: string | null
  character: {
    gender: 'boy' | 'girl'
    stage: 1 | 2 | 3 | 4 | 5
    assetKey: string | null
  }
  progress: {
    xp: number
    level: 1 | 2 | 3 | 4 | 5
    streakDays: number
    longestStreak: number
    lastActivityDate: string
    totalPrayersOffered: number
  }
}
