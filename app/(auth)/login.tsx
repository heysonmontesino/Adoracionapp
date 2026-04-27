import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { AppHeader } from '../../src/shared/components/ui/AppHeader'
import { AppButton } from '../../src/shared/components/ui/AppButton'
import { AppInput } from '../../src/shared/components/ui/AppInput'
import { Screen } from '../../src/shared/components/layout/Screen'
import { useToast } from '../../src/shared/components/feedback/Toast'
import { useAuthActions } from '../../src/features/auth/hooks/useAuthActions'
import { Tokens } from '../../src/shared/constants/tokens'

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
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AppHeader 
            variant="hero" 
            title={"BIENVENIDO\nA CASA"} 
            subtitle="Inicia sesión para continuar" 
          />

          <View style={styles.formContainer}>
            <AppInput
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <AppInput
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            <AppButton
              label="Iniciar sesión"
              onPress={handleEmailSignIn}
              isLoading={isSubmitting}
              style={styles.primaryButton}
            />
            <AppButton
              label="Continuar con Google"
              onPress={handleGoogleSignIn}
              variant="secondary"
              disabled={!isGoogleSignInAvailable}
              isLoading={isSubmitting}
              style={styles.secondaryButton}
            />

            {!isGoogleSignInAvailable && (
              <Text style={styles.helperText}>
                Google Sign-In requiere configurar el Web Client ID en el entorno local.
              </Text>
            )}

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.linkText}>
                ¿No tienes cuenta? <Text style={styles.linkAccent}>Regístrate</Text>
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
    marginBottom: Tokens.spacing[12],
  },
  secondaryButton: {
    marginBottom: Tokens.spacing[12],
  },
  helperText: {
    color: Tokens.colors.textMuted,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.caption,
    textAlign: 'center',
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
