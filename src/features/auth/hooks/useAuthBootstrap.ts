import { useEffect } from 'react'
import {
  getOrCreateUserDoc,
  initGoogleSignIn,
  onAuthStateChanged,
} from '../repository'
import { useAuthStore } from '../store'
import { Config } from '../../../shared/constants/config'
import { DEMO_USER } from '../demoUser'

export function useAuthBootstrap(): void {
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    if (Config.DEMO_UI_MODE) {
      setUser(DEMO_USER)
      return
    }

    initGoogleSignIn()
  }, [setUser])

  useEffect(() => {
    if (Config.DEMO_UI_MODE) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        return
      }

      try {
        const appUser = await getOrCreateUserDoc(firebaseUser)
        setUser(appUser)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Auth] getOrCreateUserDoc failed — user will be null in store:', msg)
        setLoading(false)
      }
    })

    return unsubscribe
  }, [setLoading, setUser])
}
