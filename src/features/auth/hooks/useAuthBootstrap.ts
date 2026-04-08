import { useEffect } from 'react'
import {
  getOrCreateUserDoc,
  initGoogleSignIn,
  onAuthStateChanged,
} from '../repository'
import { useAuthStore } from '../store'

export function useAuthBootstrap(): void {
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    initGoogleSignIn()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        return
      }

      try {
        const appUser = await getOrCreateUserDoc(firebaseUser)
        setUser(appUser)
      } catch {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [setLoading, setUser])
}
