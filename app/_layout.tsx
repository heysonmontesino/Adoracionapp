import '../global.css'
import { useCallback, useEffect, useState } from 'react'
import { LogBox, View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '../src/features/auth/store'
import { useAuthBootstrap } from '../src/features/auth/hooks/useAuthBootstrap'
import { ErrorBoundary } from '../src/shared/components/feedback/ErrorBoundary'
import { ToastProvider } from '../src/shared/components/feedback/Toast'
import { Config } from '../src/shared/constants/config'
import { Tokens } from '../src/shared/constants/tokens'
import { DEMO_USER } from '../src/features/auth/demoUser'
import { AnimatedLogoIntro } from '../src/shared/components/intro/AnimatedLogoIntro'

// Suppress dev-only native warnings
if (__DEV__) {
  LogBox.ignoreLogs([
    'No suitable image URL loader found for (null)',
    'RCTImageLoader',
  ])
}

const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  const firstArg = args[0]
  if (typeof firstArg === 'string' && (
      firstArg.includes('No suitable image URL loader found') ||
      firstArg.includes('RCTImageLoader')
  )) {
    return
  }
  originalConsoleError(...args)
}

// Keep the native splash visible until we are ready to show the JS intro
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

// ─── Auth-aware navigator ─────────────────────────────────────────────────────
function RootNavigator() {
  const storeUser    = useAuthStore((state) => state.user)
  const storeLoading = useAuthStore((state) => state.isLoading)

  const user      = Config.DEMO_UI_MODE ? (storeUser ?? DEMO_USER) : storeUser
  const isLoading = Config.DEMO_UI_MODE ? false : storeLoading

  const router   = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) return

    const inAuth        = segments[0] === '(auth)'
    const inOnboarding  = segments[0] === '(onboarding)'

    if (!user) {
      if (!inAuth)        router.replace('/(auth)/login')
    } else if (!user.onboardingCompleted) {
      if (!inOnboarding)  router.replace('/(onboarding)/welcome')
    } else {
      if (inAuth || inOnboarding) router.replace('/(tabs)')
    }
  }, [user, isLoading, segments])

  return (
    <Stack
      screenOptions={{
        headerShown:  false,
        contentStyle: { flex: 1, backgroundColor: Tokens.colors.background },
      }}
    />
  )
}

// ─── Root layout ──────────────────────────────────────────────────────────────
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

  /**
   * Intro state machine:
   *   'loading'   → fonts/assets still loading, keep native splash visible
   *   'intro'     → fonts ready, show JS animated intro, splash hidden
   *   'done'      → intro finished, render the real app
   */
  const [introState, setIntroState] = useState<'loading' | 'intro' | 'done'>('loading')

  // Once fonts are ready → hide native splash → show JS intro
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
      setIntroState('intro')
    }
  }, [fontsLoaded, fontError])

  // Called by AnimatedLogoIntro when its animation finishes
  const handleIntroFinished = useCallback(() => {
    setIntroState('done')
  }, [])

  // Still waiting for fonts
  if (!fontsLoaded && !fontError) return null

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Tokens.colors.background }}>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              {/* Main app — rendered underneath the intro so it's warm when
                  the intro fades out. Pointer events are blocked while intro
                  is playing so the user can't tap behind it. */}
              <View style={{ flex: 1 }} pointerEvents={introState === 'done' ? 'auto' : 'none'}>
                <RootNavigator />
              </View>

              {/* Animated intro — overlaid on top of the app */}
              {introState === 'intro' && (
                <AnimatedLogoIntro onFinished={handleIntroFinished} />
              )}
            </ToastProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </View>
    </SafeAreaProvider>
  )
}
