import { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { Button } from '../ui/Button'

interface EmptyStateProps {
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

export function EmptyState({
  title = 'Aún no hay contenido',
  message,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  return (
    <View className="rounded-3xl bg-surface-container-low px-6 py-8">
      <Text className="font-humane text-4xl uppercase text-on-surface leading-none mb-3">
        {title}
      </Text>
      <Text className="font-jakarta-regular text-base leading-7 text-on-surface/70">
        {message}
      </Text>
      {children ? <View className="mt-5">{children}</View> : null}
      {actionLabel && onAction ? (
        <View className="mt-6">
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  )
}
