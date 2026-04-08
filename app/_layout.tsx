import '../global.css'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useAuthStore } from '../src/features/auth/store'
import { useAuthBootstrap } from '../src/features/auth/hooks/useAuthBootstrap'
import { ErrorBoundary } from '../src/shared/components/feedback/ErrorBoundary'
import { ToastProvider } from '../src/shared/components/feedback/Toast'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

function RootNavigator() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
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
  useAuthBootstrap()

  const [fontsLoaded, fontError] = useFonts({
    'HUMANE-Bold':               require('../assets/fonts/HUMANE-Bold.ttf'),
    'PlusJakartaSans-Light':     require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    'PlusJakartaSans-Regular':   require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium':    require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold':  require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold':      require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  // All hooks called above — safe to return null before render
  if (!fontsLoaded && !fontError) return null

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
