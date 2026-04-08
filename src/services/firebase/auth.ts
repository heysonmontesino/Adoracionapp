import {
  getAuth,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  User,
} from 'firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { firebaseApp } from './config'
import { env } from '../../config/env'

const auth = getAuth(firebaseApp)

export function initGoogleSignIn(): void {
  GoogleSignin.configure({ webClientId: env.google.webClientId })
}

export async function signInWithGoogle(): Promise<User> {
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

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  return firebaseOnAuthStateChanged(auth, callback)
}
