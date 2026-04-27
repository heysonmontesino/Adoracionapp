import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../src/shared/components/layout/Screen'
import { AppButton } from '../../src/shared/components/ui/AppButton'
import { AppInput } from '../../src/shared/components/ui/AppInput'
import { AppHeader } from '../../src/shared/components/ui/AppHeader'
import { useToast } from '../../src/shared/components/feedback/Toast'
import { useAuthActions } from '../../src/features/auth/hooks/useAuthActions'
import { Tokens } from '../../src/shared/constants/tokens'

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
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AppHeader
            variant="hero"
            title={"CREA TU\nCUENTA"}
            subtitle="Únete a la familia de fe"
          />

          <View style={styles.formContainer}>
            <AppInput
              placeholder="Nombre"
              value={displayName}
              onChangeText={setDisplayName}
              textContentType="name"
            />
            <AppInput
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <AppInput
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
            />

            <AppButton
              label="Crear cuenta"
              onPress={handleRegister}
              isLoading={isSubmitting}
              style={styles.primaryButton}
            />

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.back()}
            >
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta?{' '}
                <Text style={styles.linkAccent}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Tokens.spacing[32],
  },
  formContainer: {
    paddingHorizontal: Tokens.spacing.screenPadding,
  },
  primaryButton: {
    marginTop: Tokens.spacing[8],
  },
  linkButton: {
    alignItems: 'center',
    marginTop: Tokens.spacing[24],
  },
  linkText: {
    color: Tokens.colors.textMuted,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.label,
  },
  linkAccent: {
    color: Tokens.colors.primary,
    fontFamily: Tokens.typography.fontFamily.medium,
  },
})
