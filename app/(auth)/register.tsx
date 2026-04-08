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
import { useAuthStore } from '../../src/features/auth/store'
import {
  registerWithEmail,
  getOrCreateUserDoc,
} from '../../src/features/auth/repository'
import { Colors } from '../../src/shared/constants/colors'

export default function RegisterScreen() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister() {
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const firebaseUser = await registerWithEmail(email.trim(), password)
      const appUser = await getOrCreateUserDoc(firebaseUser)
      setUser(appUser)
    } catch (e: any) {
      if (e?.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado')
      } else {
        setError('No se pudo crear la cuenta. Intenta de nuevo.')
      }
    } finally {
      setIsLoading(false)
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
            CREA TU{'\n'}CUENTA
          </Text>
          <Text className="font-jakarta-regular text-base text-on-surface/60 mb-10">
            Únete a la familia de fe
          </Text>

          {error !== null && (
            <Text className="text-red-400 font-jakarta-regular text-sm mb-4">
              {error}
            </Text>
          )}

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
            placeholder="Contraseña (mínimo 6 caracteres)"
            placeholderTextColor={Colors.onSurface60}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
          />

          <Button
            label="Crear cuenta"
            onPress={handleRegister}
            isLoading={isLoading}
          />

          <TouchableOpacity
            className="items-center mt-6"
            onPress={() => router.back()}
          >
            <Text className="font-jakarta-regular text-sm text-on-surface/60">
              ¿Ya tienes cuenta?{' '}
              <Text className="text-primary font-jakarta-medium">Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
