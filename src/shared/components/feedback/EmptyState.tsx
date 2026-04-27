import { ReactNode } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { AppButton } from '../ui/AppButton'
import { Tokens } from '../../constants/tokens'

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
    <View style={styles.container}>
      <Text style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>
        {message}
      </Text>
      {children ? <View style={styles.children}>{children}</View> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <AppButton label={actionLabel} onPress={onAction} variant="primary" />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Tokens.colors.surfaceLow,
    borderRadius: Tokens.radius.cardLarge,
    paddingHorizontal: Tokens.spacing[24],
    paddingVertical: Tokens.spacing[32],
    borderWidth: 1,
    borderColor: 'rgba(229, 223, 253, 0.08)',
  },
  title: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: Tokens.typography.fontSize.display - 32, // Approx 40
    color: Tokens.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 40,
    marginBottom: Tokens.spacing[12],
  },
  message: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.h3,
    color: Tokens.colors.textMuted,
    lineHeight: 28,
  },
  children: {
    marginTop: Tokens.spacing[24],
  },
  action: {
    marginTop: Tokens.spacing[24],
  },
})
