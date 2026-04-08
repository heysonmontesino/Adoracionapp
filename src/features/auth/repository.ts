import {
  initGoogleSignIn,
  isGoogleSignInConfigured,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  updateAuthDisplayName,
  signOut,
  onAuthStateChanged,
} from '../../services/firebase/auth'
import {
  getDocument,
  setDocument,
  Timestamp,
  updateDocument,
} from '../../services/firebase/firestore'
import { AppUser, CharacterProfile, SpiritualProgress } from './types'
import { User } from 'firebase/auth'

function userDocPath(uid: string): string {
  return `users/${uid}`
}

export async function fetchUserDoc(uid: string): Promise<AppUser | null> {
  return getDocument<AppUser>(userDocPath(uid))
}

interface UserDocOverrides {
  displayName?: string
}

function getTodayDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function createDefaultCharacter(): CharacterProfile {
  return { gender: 'boy', stage: 1, assetKey: null }
}

function createDefaultProgress(now: Date): SpiritualProgress {
  return {
    xp: 0,
    level: 1,
    streakDays: 0,
    longestStreak: 0,
    lastActivityDate: getTodayDateKey(now),
    totalPrayersOffered: 0,
  }
}

function createAuthUserDocument(
  firebaseUser: User,
  overrides: UserDocOverrides = {},
): AppUser {
  const now = new Date()
  const nowTimestamp = Timestamp.now()

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    displayName: overrides.displayName ?? firebaseUser.displayName ?? '',
    photoURL: firebaseUser.photoURL,
    role: 'member',
    status: 'active',
    createdAt: nowTimestamp,
    lastLoginAt: nowTimestamp,
    onboardingCompleted: false,
    selectedChurchCampus: null,
    character: createDefaultCharacter(),
    progress: createDefaultProgress(now),
  }
}

export async function createUserDoc(
  firebaseUser: User,
  overrides: UserDocOverrides = {},
): Promise<AppUser> {
  const newUser = createAuthUserDocument(firebaseUser, overrides)
  await setDocument(userDocPath(firebaseUser.uid), newUser)
  return newUser
}

export async function updateLastLogin(uid: string): Promise<void> {
  await updateDocument(userDocPath(uid), { lastLoginAt: Timestamp.now() })
}

export async function getOrCreateUserDoc(firebaseUser: User): Promise<AppUser> {
  const existing = await fetchUserDoc(firebaseUser.uid)
  if (existing) {
    const lastLoginAt = Timestamp.now()
    await updateDocument(userDocPath(firebaseUser.uid), { lastLoginAt })
    return { ...existing, lastLoginAt }
  }
  return createUserDoc(firebaseUser)
}

export {
  initGoogleSignIn,
  isGoogleSignInConfigured,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  updateAuthDisplayName,
  signOut,
  onAuthStateChanged,
}
