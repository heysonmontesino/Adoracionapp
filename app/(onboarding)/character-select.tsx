import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Screen } from '../../src/shared/components/layout/Screen'
import { Button } from '../../src/shared/components/ui/Button'
import { useToast } from '../../src/shared/components/feedback/Toast'
import { useOnboardingActions } from '../../src/features/onboarding/hooks/useOnboardingActions'
import { CharacterGender } from '../../src/features/character/types'

const OPTIONS: { gender: CharacterGender; label: string }[] = [
  { gender: 'boy', label: 'NIÑO' },
  { gender: 'girl', label: 'NIÑA' },
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
    <Screen>
      <View className="flex-1 px-6 pt-12">
        <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
          ¿CÓMO TE{'\n'}IDENTIFICAS?
        </Text>
        <Text className="font-jakarta-regular text-base text-on-surface/60 mb-10">
          Esto personaliza tu experiencia en la app.
        </Text>

        <View className="flex-row gap-4 mb-12">
          {OPTIONS.map(({ gender, label }) => (
            <TouchableOpacity
              key={gender}
              className={[
                'flex-1 h-48 rounded-2xl items-center justify-center',
                selected === gender ? 'bg-surface-bright' : 'bg-surface-container-low',
              ].join(' ')}
              onPress={() => setSelected(gender)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === gender }}
            >
              <Text
                className={[
                  'font-humane text-5xl uppercase',
                  selected === gender ? 'text-primary' : 'text-on-surface',
                ].join(' ')}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Continuar"
          onPress={handleContinue}
          disabled={selected === null}
          isLoading={isSubmitting}
        />
      </View>
    </Screen>
  )
}
