import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native'
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { Screen } from '../../src/shared/components/layout/Screen'
import { AppButton } from '../../src/shared/components/ui/AppButton'
import { AppHeader } from '../../src/shared/components/ui/AppHeader'
import { useToast } from '../../src/shared/components/feedback/Toast'
import { useOnboardingActions } from '../../src/features/onboarding/hooks/useOnboardingActions'
import { CharacterGender } from '../../src/features/character/types'
import { Tokens } from '../../src/shared/constants/tokens'

const { width } = Dimensions.get('window')

const OPTIONS: { gender: CharacterGender; label: string; image: any }[] = [
  { 
    gender: 'male', 
    label: 'Hombre', 
    image: require('../../assets/onboarding/man_selection.png') 
  },
  { 
    gender: 'female', 
    label: 'Mujer', 
    image: require('../../assets/onboarding/woman_selection.png') 
  },
]

export default function CharacterSelectScreen() {
  const { completeOnboardingForCurrentUser, isSubmitting, user } =
    useOnboardingActions()
  const { showToast } = useToast()
  const [selected, setSelected] = useState<CharacterGender | null>(null)

  async function handleContinue() {
    if (!selected || !user) return

    const success = await completeOnboardingForCurrentUser(selected)

    if (!success) {
      showToast({
        message: 'No se pudo guardar tu selección. Intenta de nuevo.',
        tone: 'error',
      })
    }
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.headerSection}>
        <Animated.View entering={FadeInDown.duration(800).delay(200)}>
          <AppHeader
            variant="screen"
            title={"TU IDENTIDAD\nESPIRITUAL"}
            subtitle="Elige la base visual que te acompañará en esta travesía de fe."
          />
        </Animated.View>
      </View>

      <View style={styles.content}>
        <View style={styles.optionsContainer}>
          {OPTIONS.map(({ gender, label, image }, index) => {
            const isSelected = selected === gender
            
            return (
              <Animated.View 
                key={gender} 
                entering={FadeInDown.duration(800).delay(400 + index * 200)}
                style={styles.optionWrapper}
              >
                <TouchableOpacity
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => setSelected(gender)}
                  activeOpacity={0.8}
                >
                  <View style={styles.imageContainer}>
                    <Image source={image} style={styles.optionImage} resizeMode="contain" />
                    {isSelected && (
                      <Animated.View 
                        entering={FadeInDown.duration(400)}
                        style={styles.selectedIndicator}
                      >
                        <View style={styles.glowCircle} />
                      </Animated.View>
                    )}
                  </View>
                  
                  <View style={styles.labelContainer}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )
          })}
        </View>

        <Animated.View 
          entering={FadeInDown.duration(600).delay(1000)}
          style={styles.footer}
        >
          <AppButton
            label="COMENZAR MI CAMINO"
            onPress={handleContinue}
            disabled={selected === null}
            isLoading={isSubmitting}
            variant="primary"
            style={styles.button}
          />
        </Animated.View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F0D1E', // Darker, more mysterious indigo
  },
  headerSection: {
    paddingTop: Tokens.spacing[24],
  },
  content: {
    flex: 1,
    paddingHorizontal: Tokens.spacing.screenPadding,
    paddingBottom: Tokens.spacing.sectionGap,
    justifyContent: 'space-between',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: Tokens.spacing.cardPadding,
    height: 420,
    marginTop: Tokens.spacing.cardPadding,
  },
  optionWrapper: {
    flex: 1,
  },
  option: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'space-between',
    paddingVertical: Tokens.spacing[24],
  },
  optionSelected: {
    backgroundColor: 'rgba(15, 223, 223, 0.05)',
    borderColor: '#0fdfdf',
    shadowColor: '#0fdfdf',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  optionImage: {
    width: '85%',
    height: '85%',
    opacity: 0.85,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: -10,
    width: 60,
    height: 4,
    backgroundColor: '#0fdfdf',
    borderRadius: 2,
  },
  glowCircle: {
    position: 'absolute',
    top: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(15, 223, 223, 0.1)',
    zIndex: -1,
  },
  labelContainer: {
    alignItems: 'center',
    marginTop: Tokens.spacing[16],
  },
  optionLabel: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  optionLabelSelected: {
    color: '#0fdfdf',
    textShadowColor: 'rgba(15, 223, 223, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  footer: {
    marginBottom: Tokens.spacing.cardPadding,
  },
  button: {
    height: 64,
    borderRadius: 32,
  },
})

