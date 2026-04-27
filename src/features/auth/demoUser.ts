import type { AppUser } from './types'
import { Timestamp } from '../../services/firebase/firestore'

export const DEMO_USER: AppUser = {
  uid: 'demo-user',
  email: 'demo@adoracion.app',
  displayName: 'Usuario Demo',
  photoURL: null,
  role: 'member',
  status: 'active',
  createdAt: Timestamp.now(),
  lastLoginAt: Timestamp.now(),
  onboardingCompleted: true,
  selectedChurchCampus: null,
  character: { gender: 'male', stage: 'baby', assetKey: null },
  progress: {
    xp: 0,
    level: 1,
    streakDays: 0,
    longestStreak: 0,
    lastActivityDate: new Date().toISOString().split('T')[0],
    totalPrayersOffered: 0,
  },
}
