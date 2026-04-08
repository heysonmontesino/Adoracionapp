import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../src/shared/components/layout/Screen'
import { Button } from '../../src/shared/components/ui/Button'
import { useToast } from '../../src/shared/components/feedback/Toast'
import { useAuthActions } from '../../src/features/auth/hooks/useAuthActions'
import { Colors } from '../../src/shared/constants/colors'

export default function LoginScreen() {
  const router = useRouter()
  const {
    authenticateWithEmail,
    authenticateWithGoogle,
    isGoogleSignInAvailable,
    isSubmitting,
  } = useAuthActions()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleGoogleSignIn() {
    const success = await authenticateWithGoogle()

    if (!success) {
      showToast({
        message: 'No se pudo iniciar sesión con Google. Intenta de nuevo.',
        tone: 'error',
      })
    }
  }

  async function handleEmailSignIn() {
    if (!email.trim() || !password) {
      showToast({
        message: 'Ingresa tu correo y contraseña.',
        tone: 'error',
      })
      return
    }

    const success = await authenticateWithEmail(email.trim(), password)

    if (!success) {
      showToast({
        message: 'Correo o contraseña incorrectos.',
        tone: 'error',
      })
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center px-6">
          <Text className="font-humane text-6xl text-on-surface uppercase leading-none mb-2">
            BIENVENIDO{'\n'}A CASA
          </Text>
          <Text className="font-jakarta-regular text-base text-on-surface/60 mb-10">
            Inicia sesión para continuar
          </Text>

          <TextInput
            className="bg-surface-container-low rounded-xl px-4 py-3 text-on-surface font-jakarta-regular mb-3"
            placeholder="Correo electrónico"
            placeholderTextColor={Colors.onSurface60}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextInput
            className="bg-surface-container-low rounded-xl px-4 py-3 text-on-surface font-jakarta-regular mb-6"
            placeholder="Contraseña"
            placeholderTextColor={Colors.onSurface60}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />

          <Button
            label="Iniciar sesión"
            onPress={handleEmailSignIn}
            isLoading={isSubmitting}
            style={{ marginBottom: 12 }}
          />
          <Button
            label="Continuar con Google"
            onPress={handleGoogleSignIn}
            variant="secondary"
            disabled={!isGoogleSignInAvailable}
            isLoading={isSubmitting}
          />

          {!isGoogleSignInAvailable && (
            <Text className="font-jakarta-regular text-sm text-on-surface/60 mt-3">
              Google Sign-In requiere configurar el Web Client ID en el entorno local.
            </Text>
          )}

          <TouchableOpacity
            className="items-center mt-6"
            onPress={() => router.push('/(auth)/register')}
          >
            <Text className="font-jakarta-regular text-sm text-on-surface/60">
              ¿No tienes cuenta?{' '}
              <Text className="text-primary font-jakarta-medium">Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
