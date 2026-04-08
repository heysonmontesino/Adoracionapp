import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Screen } from '../../src/shared/components/layout/Screen'
import { Button } from '../../src/shared/components/ui/Button'
import { useAuthStore } from '../../src/features/auth/store'
import { useCharacterStore } from '../../src/features/character/store'
import { completeOnboarding } from '../../src/features/onboarding/repository'
import { CharacterGender } from '../../src/features/character/types'

const OPTIONS: { gender: CharacterGender; label: string }[] = [
  { gender: 'boy', label: 'NIÑO' },
  { gender: 'girl', label: 'NIÑA' },
]

export default function CharacterSelectScreen() {
  const { user, setUser } = useAuthStore()
  const { setGender } = useCharacterStore()
  const [selected, setSelected] = useState<CharacterGender | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleContinue() {
    if (!selected || !user) return
    setIsLoading(true)
    try {
      await completeOnboarding(user.uid, selected)
    } catch {
      // Firestore write failed — local state still updated.
      // Next onAuthStateChanged will re-sync from Firestore.
    } finally {
      setGender(selected)
      setUser({
        ...user,
        onboardingCompleted: true,
        character: { ...user.character, gender: selected },
      })
      setIsLoading(false)
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
                'flex-1 h-48 rounded-2xl items-center justify-center bg-surface-container-low',
                selected === gender ? 'border-2 border-primary' : '',
              ].join(' ')}
              onPress={() => setSelected(gender)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === gender }}
            >
              <Text className="font-humane text-5xl text-on-surface uppercase">
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Continuar"
          onPress={handleContinue}
          disabled={selected === null}
          isLoading={isLoading}
        />
      </View>
    </Screen>
  )
}
