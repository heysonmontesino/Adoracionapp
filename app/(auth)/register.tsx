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

export default function RegisterScreen() {
  const router = useRouter()
  const { registerAccount, isSubmitting } = useAuthActions()
  const { showToast } = useToast()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleRegister() {
    if (!displayName.trim()) {
      showToast({ message: 'Ingresa tu nombre.', tone: 'error' })
      return
    }
    if (!email.trim() || !password) {
      showToast({ message: 'Ingresa tu correo y contraseña.', tone: 'error' })
      return
    }
    if (password.length < 6) {
      showToast({
        message: 'La contraseña debe tener al menos 6 caracteres.',
        tone: 'error',
      })
      return
    }

    const result = await registerAccount(displayName, email.trim(), password)

    if (!result.ok) {
      if (result.code === 'auth/email-already-in-use') {
        showToast({ message: 'Este correo ya está registrado.', tone: 'error' })
      } else {
        showToast({
          message: 'No se pudo crear y guardar la cuenta. Intenta de nuevo.',
          tone: 'error',
        })
      }
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

          <TextInput
            className="bg-surface-container-low rounded-xl px-4 py-3 text-on-surface font-jakarta-regular mb-3"
            placeholder="Nombre"
            placeholderTextColor={Colors.onSurface60}
            value={displayName}
            onChangeText={setDisplayName}
            textContentType="name"
          />
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
            isLoading={isSubmitting}
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
