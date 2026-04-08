import { View, StyleProp, ViewStyle } from 'react-native'

interface SkeletonProps {
  width?: number | `${number}%`
  height?: number
  borderRadius?: number
  style?: StyleProp<ViewStyle>
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  return (
    <View
      className="bg-surface-container"
      style={[{ width, height, borderRadius }, style]}
    />
  )
}
