import {
  getAuth,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  User,
} from 'firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { firebaseApp } from './config'
import { env } from '../../config/env'

const auth = getAuth(firebaseApp)

export function isGoogleSignInConfigured(): boolean {
  return env.google.webClientId.trim().length > 0
}

export function initGoogleSignIn(): boolean {
  if (!isGoogleSignInConfigured()) {
    return false
  }

  GoogleSignin.configure({ webClientId: env.google.webClientId })
  return true
}

export async function signInWithGoogle(): Promise<User> {
  if (!isGoogleSignInConfigured()) {
    throw new Error('Google Sign-In is not configured')
  }

  await GoogleSignin.hasPlayServices()
  const response = await GoogleSignin.signIn()
  const idToken = response.data?.idToken
  if (!idToken) throw new Error('Google Sign-In failed: no idToken returned')
  const credential = GoogleAuthProvider.credential(idToken)
  const result = await signInWithCredential(auth, credential)
  return result.user
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function updateAuthDisplayName(
  user: User,
  displayName: string,
): Promise<void> {
  await updateProfile(user, { displayName })
}

export async function signOut(): Promise<void> {
  if (isGoogleSignInConfigured()) {
    try {
      await GoogleSignin.signOut()
    } catch {
      // Fall back to Firebase sign-out even if Google session cleanup fails.
    }
  }

  await firebaseSignOut(auth)
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  return firebaseOnAuthStateChanged(auth, callback)
}
