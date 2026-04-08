import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../src/shared/components/layout/Screen'
import { Button } from '../../src/shared/components/ui/Button'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <Screen>
      <View className="flex-1 justify-end px-6 pb-12">
        <View className="mb-10">
          <Text className="font-humane text-7xl text-on-surface uppercase leading-none mb-6">
            BIENVENIDO{'\n'}A ADORACIÓN
          </Text>
          <Text className="font-jakarta-regular text-base text-on-surface/70 leading-relaxed">
            Un espacio para crecer en tu fe, conectar con tu comunidad y vivir tu
            camino espiritual cada día.
          </Text>
        </View>
        <Button
          label="Comenzar"
          onPress={() => router.push('/(onboarding)/character-select')}
        />
      </View>
    </Screen>
  )
}
