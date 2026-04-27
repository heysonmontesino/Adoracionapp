import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native'
import { Tokens } from '../../constants/tokens'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface AppButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  isLoading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  icon?: React.ReactNode
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  testID,
  icon,
}: AppButtonProps) {
  const isDisabled = disabled || isLoading

  const getContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: Tokens.colors.primary }
      case 'secondary':
        return { 
          backgroundColor: 'rgba(229, 223, 253, 0.05)', 
          borderWidth: 1.5, 
          borderColor: 'rgba(229, 223, 253, 0.3)' 
        }
      case 'ghost':
        return { backgroundColor: 'transparent' }
    }
  }

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return Tokens.colors.background
      case 'secondary':
      case 'ghost':
        return Tokens.colors.textPrimary
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getContainerStyle(),
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: getTextColor() }, !!icon && { marginLeft: Tokens.spacing[8] }]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    height: Tokens.sizing.buttonHeight,
    borderRadius: Tokens.radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing[24],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: Tokens.typography.fontFamily.semiBold,
    fontSize: Tokens.typography.fontSize.body,
  },
})
