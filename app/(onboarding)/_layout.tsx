import { Slot } from 'expo-router'
import { View } from 'react-native'
import { Colors } from '../../src/shared/constants/colors'

export default function OnboardingLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Slot />
    </View>
  )
}
