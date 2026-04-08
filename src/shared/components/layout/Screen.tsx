import { SafeAreaView, StatusBar, StyleProp, ViewStyle } from 'react-native'
import { ReactNode } from 'react'

interface ScreenProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export function Screen({ children, style }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" style={style}>
      <StatusBar barStyle="light-content" backgroundColor="#131026" />
      {children}
    </SafeAreaView>
  )
}
