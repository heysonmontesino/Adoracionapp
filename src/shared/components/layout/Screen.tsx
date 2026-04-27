import { View, StatusBar, StyleProp, ViewStyle, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ReactNode } from 'react'
import { Tokens } from '../../constants/tokens'

interface ScreenProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  withPadding?: boolean
}

export function Screen({ children, style, withPadding = false }: ScreenProps) {
  const insets = useSafeAreaInsets()
  const { height, width } = useWindowDimensions()

  return (
    <View
      style={[
        {
          flex: 1,
          width,
          minHeight: height,
          alignSelf: 'stretch',
          backgroundColor: Tokens.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left + (withPadding ? Tokens.spacing.screenPadding : 0),
          paddingRight: insets.right + (withPadding ? Tokens.spacing.screenPadding : 0),
        },
        style,
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={Tokens.colors.background} />
      {children}
    </View>
  )
}
