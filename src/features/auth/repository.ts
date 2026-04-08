import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  signOut,
  onAuthStateChanged,
} from '../../services/firebase/auth'
import {
  getDocument,
  setDocument,
  updateDocument,
} from '../../services/firebase/firestore'
import { AppUser } from './types'
import { User } from 'firebase/auth'

function userDocPath(uid: string): string {
  return `users/${uid}`
}

export async function fetchUserDoc(uid: string): Promise<AppUser | null> {
  return getDocument<AppUser>(userDocPath(uid))
}

export async function createUserDoc(firebaseUser: User): Promise<AppUser> {
  const now = new Date().toISOString()
  const newUser: AppUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName ?? '',
    photoURL: firebaseUser.photoURL,
    role: 'member',
    status: 'active',
    createdAt: now,
    lastLoginAt: now,
    onboardingCompleted: false,
    selectedChurchCampus: null,
    character: { gender: 'boy', stage: 1, assetKey: null },
    progress: {
      xp: 0,
      level: 1,
      streakDays: 0,
      longestStreak: 0,
      lastActivityDate: now.split('T')[0],
      totalPrayersOffered: 0,
    },
  }
  await setDocument(userDocPath(firebaseUser.uid), newUser)
  return newUser
}

export async function updateLastLogin(uid: string): Promise<void> {
  await updateDocument(userDocPath(uid), { lastLoginAt: new Date().toISOString() })
}

export async function getOrCreateUserDoc(firebaseUser: User): Promise<AppUser> {
  const existing = await fetchUserDoc(firebaseUser.uid)
  if (existing) {
    await updateLastLogin(firebaseUser.uid)
    return { ...existing, lastLoginAt: new Date().toISOString() }
  }
  return createUserDoc(firebaseUser)
}

export { signInWithGoogle, signInWithEmail, registerWithEmail, signOut, onAuthStateChanged }
