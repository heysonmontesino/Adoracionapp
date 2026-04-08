/**
 * CharacterPlaceholder
 *
 * Renders a visual stand-in for the character while Lottie assets are
 * not yet bundled. Shows the character's gender initial and current
 * animation label in the Sacred Reverence style.
 *
 * REPLACE THIS with CharacterDisplay.tsx once Lottie JSON files are
 * placed in assets/character/{gender}/*.json
 */
import { View, Text } from 'react-native'
import { useCharacterStore } from './store'

const ANIMATION_LABELS: Record<string, string> = {
  idle: '...',
  loading: 'Cargando',
  level_up: '¡Nuevo nivel!',
  celebrate: '¡Bien hecho!',
  streak_milestone: '¡Racha!',
  welcome: '¡Bienvenido!',
}

export function CharacterPlaceholder() {
  const gender = useCharacterStore((s) => s.gender)
  const animation = useCharacterStore((s) => s.currentAnimation)

  const initial = gender === 'boy' ? 'H' : 'M'
  const label = ANIMATION_LABELS[animation] ?? animation

  return (
    <View className="items-center gap-3">
      <View className="w-24 h-24 rounded-full bg-surface-container items-center justify-center">
        <Text className="font-humane text-5xl text-primary uppercase">
          {initial}
        </Text>
      </View>
      {animation !== 'idle' ? (
        <Text className="font-jakarta-medium text-xs text-primary uppercase tracking-[2px]">
          {label}
        </Text>
      ) : null}
    </View>
  )
}
