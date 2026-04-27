import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../src/shared/components/layout/Screen'
import { AppButton } from '../../src/shared/components/ui/AppButton'
import { Tokens } from '../../src/shared/constants/tokens'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.heroBlock}>
          <Text style={styles.title}>BIENVENIDO{'\n'}A ADORACIÓN</Text>
          <Text style={styles.subtitle}>
            Un espacio para crecer en tu fe, conectar con tu comunidad y vivir tu
            camino espiritual cada día.
          </Text>
        </View>
        <AppButton
          label="Comenzar"
          onPress={() => router.push('/(onboarding)/character-select')}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Tokens.spacing.screenPadding,
    paddingBottom: Tokens.spacing[48],
  },
  heroBlock: {
    marginBottom: Tokens.spacing[32],
  },
  title: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: Tokens.typography.fontSize.display,
    color: Tokens.colors.textPrimary,
    textTransform: 'uppercase',
    lineHeight: Tokens.typography.fontSize.display * 0.9,
    marginBottom: Tokens.spacing[16],
  },
  subtitle: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.body,
    color: Tokens.colors.textMuted,
    lineHeight: Tokens.typography.fontSize.body * 1.6,
  },
})
