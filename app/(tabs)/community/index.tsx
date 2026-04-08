import { View, Text } from 'react-native'
import { Screen } from '../../../src/shared/components/layout/Screen'

export default function CommunityScreen() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <Text className="font-humane text-4xl text-on-surface uppercase">COMUNIDAD</Text>
        <Text className="font-jakarta-regular text-sm text-on-surface/50 mt-2">Próximamente — Sprint 5</Text>
      </View>
    </Screen>
  )
}
