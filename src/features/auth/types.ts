export type UserRole = 'member' | 'leader' | 'pastor' | 'admin'
export type UserStatus = 'active' | 'blocked'

import { FirestoreTimestampValue } from '../../shared/types/firestore'
import { CharacterGender, SpiritualStage } from '../character/types'

export interface CharacterProfile {
  gender: CharacterGender
  stage: SpiritualStage
  assetKey: string | null
  stageOverride?: SpiritualStage
  genderOverride?: CharacterGender
}

export interface SpiritualProgress {
  xp: number
  level: 1 | 2 | 3 | 4 | 5
  streakDays: number
  longestStreak: number
  lastActivityDate: string
  totalPrayersOffered: number
}

export interface AppUser {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  role: UserRole
  status: UserStatus
  createdAt: FirestoreTimestampValue
  lastLoginAt: FirestoreTimestampValue
  onboardingCompleted: boolean
  selectedChurchCampus: string | null
  character: CharacterProfile
  progress: SpiritualProgress
}
