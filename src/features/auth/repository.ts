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

function describeFirestoreError(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeError = error as {
      code?: unknown
      message?: unknown
      name?: unknown
      stack?: unknown
    }

    return {
      code: typeof maybeError.code === 'string' ? maybeError.code : undefined,
      message: typeof maybeError.message === 'string' ? maybeError.message : String(error),
      name: typeof maybeError.name === 'string' ? maybeError.name : undefined,
      stack: typeof maybeError.stack === 'string' ? maybeError.stack : undefined,
    }
  }

  return { message: String(error) }
}

function isPermissionDenied(error: unknown): boolean {
  return (
    error != null
    && typeof error === 'object'
    && 'code' in error
    && (error as { code?: unknown }).code === 'permission-denied'
  )
}

export async function fetchUserDoc(uid: string): Promise<AppUser | null> {
  console.log(`[fetchUserDoc] getDocument users/${uid}`)
  try {
    const doc = await getDocument<AppUser>(userDocPath(uid))
    console.log(`[fetchUserDoc] users/${uid}: ${doc ? 'FOUND' : 'NOT_FOUND'}`)
    return doc
  } catch (error: unknown) {
    console.error(`[fetchUserDoc] FAILED users/${uid}`, describeFirestoreError(error))
    throw error
  }
}

interface UserDocOverrides {
  displayName?: string
}

function getTodayDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function createDefaultCharacter(): CharacterProfile {
  return { gender: 'male', stage: 'baby', assetKey: null }
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
  const path = userDocPath(firebaseUser.uid)
  console.log(`[createUserDoc] setDocument ${path}`)
  console.log('[createUserDoc] payload', JSON.stringify(newUser, null, 2))

  try {
    await setDocument(path, newUser)
    console.log(`[createUserDoc] SUCCESS ${path}`)
    return newUser
  } catch (error: unknown) {
    console.error(`[createUserDoc] FAILED ${path}`, describeFirestoreError(error))
    throw error
  }
}

export async function updateLastLogin(uid: string): Promise<void> {
  await updateDocument(userDocPath(uid), { lastLoginAt: Timestamp.now() })
}

export async function getOrCreateUserDoc(firebaseUser: User): Promise<AppUser> {
  const uid = firebaseUser.uid
  const email = firebaseUser.email
  const path = userDocPath(uid)

  console.log('[getOrCreateUserDoc] START', {
    uid,
    email,
    providerIds: firebaseUser.providerData.map((provider) => provider.providerId),
    isAnonymous: firebaseUser.isAnonymous,
  })

  let existing: AppUser | null = null
  try {
    console.log(`[getOrCreateUserDoc] [read] ${path}`)
    existing = await fetchUserDoc(uid)
    console.log(`[getOrCreateUserDoc] [read] exists=${!!existing}`)
  } catch (error: unknown) {
    console.error(`[getOrCreateUserDoc] [read] FAILED ${path}`, describeFirestoreError(error))
    throw error
  }

  if (existing) {
    const lastLoginAt = Timestamp.now()
    const payload = { lastLoginAt }
    console.log(`[getOrCreateUserDoc] [update:lastLoginAt] ${path}`, payload)
    try {
      await updateDocument(path, payload)
      console.log(`[getOrCreateUserDoc] [update:lastLoginAt] SUCCESS ${path}`)
      return { ...existing, lastLoginAt }
    } catch (error: unknown) {
      console.error(
        `[getOrCreateUserDoc] [update:lastLoginAt] FAILED ${path}`,
        describeFirestoreError(error),
      )
      // We don't necessarily want to block login if just the lastLoginAt update fails,
      // but the user wants to know what fails.
      throw error
    }
  }

  console.log(`[getOrCreateUserDoc] [create] ${path}`)
  try {
    const newUser = await createUserDoc(firebaseUser)
    console.log(`[getOrCreateUserDoc] [create] SUCCESS ${path}`)
    return newUser
  } catch (error: unknown) {
    console.error(`[getOrCreateUserDoc] [create] FAILED ${path}`, describeFirestoreError(error))

    if (isPermissionDenied(error)) {
      console.warn(
        `[getOrCreateUserDoc] [create] permission-denied; checking whether ${path} was created by a concurrent auth bootstrap`,
      )
      const racedUser = await fetchUserDoc(uid)
      if (racedUser) {
        console.warn(`[getOrCreateUserDoc] [create] recovered from concurrent create for ${path}`)
        return racedUser
      }
    }

    throw error
  }
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
