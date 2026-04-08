import '../global.css'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { useAuthStore } from '../src/features/auth/store'
import {
  onAuthStateChanged,
  getOrCreateUserDoc,
} from '../src/features/auth/repository'
import { initGoogleSignIn } from '../src/services/firebase/auth'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

function RootNavigator() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) return

    const inAuth = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login')
    } else if (!user.onboardingCompleted) {
      if (!inOnboarding) router.replace('/(onboarding)/welcome')
    } else {
      if (inAuth || inOnboarding) router.replace('/(tabs)/')
    }
  }, [user, isLoading, segments])

  return <Stack screenOptions={{ headerShown: false }} />
}

export default function RootLayout() {
  const { setUser, setLoading } = useAuthStore()

  // TODO Task 13: Load custom fonts here after font files are placed in assets/fonts/
  // useFonts({ 'HUMANE-Bold': require('../assets/fonts/HUMANE-Bold.otf'), ... })

  useEffect(() => {
    // Hide splash immediately until fonts are loaded in Task 13
    SplashScreen.hideAsync()
  }, [])

  useEffect(() => {
    initGoogleSignIn()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await getOrCreateUserDoc(firebaseUser)
          setUser(appUser)
        } catch {
          setLoading(false)
        }
      } else {
        setUser(null)
      }
    })
    return unsubscribe
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  )
}
