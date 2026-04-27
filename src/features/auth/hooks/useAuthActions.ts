import { useState } from 'react'
import {
  createUserDoc,
  getOrCreateUserDoc,
  isGoogleSignInConfigured,
  registerWithEmail,
  signOut,
  signInWithEmail,
  signInWithGoogle,
  updateAuthDisplayName,
} from '../repository'
import { useAuthStore } from '../store'

export function useAuthActions() {
  const setUser = useAuthStore((state) => state.setUser)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function runAuthAction<T>(action: () => Promise<T>): Promise<T> {
    setIsSubmitting(true)

    try {
      return await action()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function syncAuthenticatedUser(
    firebaseUser: Awaited<ReturnType<typeof signInWithGoogle>>,
  ): Promise<boolean> {
    try {
      const appUser = await getOrCreateUserDoc(firebaseUser)
      setUser(appUser)
      return true
    } catch {
      return false
    }
  }

  async function authenticateWithGoogle(): Promise<boolean> {
    return runAuthAction(async () => {
      try {
        await signInWithGoogle()
        // onAuthStateChanged in useAuthBootstrap is the single owner of
        // creating/reading users/{uid}; doing it here too races new-user writes.
        return true
      } catch (error) {
        console.error('[authenticateWithGoogle] Hook failure:', error)
        return false
      }
    })
  }

  async function authenticateWithEmail(
    email: string,
    password: string,
  ): Promise<boolean> {
    return runAuthAction(async () => {
      try {
        const firebaseUser = await signInWithEmail(email, password)
        return syncAuthenticatedUser(firebaseUser)
      } catch {
        return false
      }
    })
  }

  async function registerAccount(
    displayName: string,
    email: string,
    password: string,
  ): Promise<{ ok: true } | { ok: false; code?: string }> {
    return runAuthAction(async () => {
      let shouldRollbackSession = false

      try {
        const trimmedDisplayName = displayName.trim()
        const firebaseUser = await registerWithEmail(email, password)
        shouldRollbackSession = true

        await updateAuthDisplayName(firebaseUser, trimmedDisplayName)

        const appUser = await createUserDoc(firebaseUser, {
          displayName: trimmedDisplayName,
        })

        setUser(appUser)
        return { ok: true }
      } catch (error) {
        if (shouldRollbackSession) {
          try {
            await signOut()
          } catch {
            // Keep the original registration failure as the primary outcome.
          }
        }

        const code =
          error instanceof Error && 'code' in error && typeof error.code === 'string'
            ? error.code
            : undefined

        return { ok: false, code }
      }
    })
  }

  return {
    authenticateWithGoogle,
    authenticateWithEmail,
    isGoogleSignInAvailable: isGoogleSignInConfigured(),
    registerAccount,
    isSubmitting,
  }
}
