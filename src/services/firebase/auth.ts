import {
  initializeAuth,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  User,
} from 'firebase/auth'
// @ts-ignore – getReactNativePersistence is in firebase/auth at runtime (Metro resolves the react-native condition) but is absent from the public types d.ts
import { getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { firebaseApp } from './config'
import { env } from '../../config/env'

const auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
})

export function isGoogleSignInConfigured(): boolean {
  return env.google.webClientId.trim().length > 0
}

export function initGoogleSignIn(): boolean {
  if (!isGoogleSignInConfigured()) {
    return false
  }

  GoogleSignin.configure({
    webClientId: env.google.webClientId,
    iosClientId: env.google.iosClientId,
  })
  return true
}

export async function signInWithGoogle(): Promise<User> {
  if (!isGoogleSignInConfigured()) {
    console.error('[signInWithGoogle] Config error: webClientId is missing');
    throw new Error('Google Sign-In is not configured')
  }

  try {
    console.log('[signInWithGoogle] Calling hasPlayServices...');
    await GoogleSignin.hasPlayServices()
    
    console.log('[signInWithGoogle] Calling GoogleSignin.signIn...');
    const response = await GoogleSignin.signIn()
    console.log('[signInWithGoogle] Google response status:', response.type);

    const idToken = response.data?.idToken
    if (!idToken) {
      console.error('[signInWithGoogle] Failed: No idToken in response', JSON.stringify(response, null, 2));
      throw new Error('Google Sign-In failed: no idToken returned')
    }

    console.log('[signInWithGoogle] Creating Firebase credential with idToken...');
    const credential = GoogleAuthProvider.credential(idToken)
    
    console.log('[signInWithGoogle] Signing in with Firebase credential...');
    const result = await signInWithCredential(auth, credential)
    console.log('[signInWithGoogle] Success! User UID:', result.user.uid);
    
    return result.user
  } catch (error: any) {
    console.error('[signInWithGoogle] CRITICAL ERROR:', {
      code: error.code,
      message: error.message,
      details: error
    });
    throw error;
  }
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
