import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { Colors } from '../../constants/colors'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  isLoading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}

const containerClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary rounded-full py-4 items-center',
  secondary: 'bg-surface-bright rounded-full py-4 items-center',
  ghost: 'rounded-full py-4 items-center',
}

const textClass: Record<ButtonVariant, string> = {
  primary: 'font-jakarta-bold text-base text-[#003737]',
  secondary: 'font-jakarta-bold text-base text-primary',
  ghost: 'font-jakarta-bold text-base text-primary',
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <TouchableOpacity
      className={`${containerClass[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={style}
      testID={testID}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.onPrimary : Colors.primary}
        />
      ) : (
        <Text className={textClass[variant]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}
