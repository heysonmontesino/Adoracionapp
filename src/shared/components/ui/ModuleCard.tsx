import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Tokens } from '../../constants/tokens'

type ModuleCardVariant = 'horizontal' | 'vertical'

interface ModuleCardProps {
  title: string
  subtitle?: string
  eyebrow?: string
  description?: string
  onPress?: () => void
  icon?: React.ReactNode
  style?: StyleProp<ViewStyle>
  variant?: ModuleCardVariant
}

export function ModuleCard({
  title,
  subtitle,
  eyebrow,
  description,
  onPress,
  icon,
  style,
  variant = 'horizontal',
}: ModuleCardProps) {
  const CardContainer = onPress ? TouchableOpacity : View
  const isVertical = variant === 'vertical'

  return (
    <CardContainer
      style={[
        styles.container,
        isVertical && styles.containerVertical,
        style,
      ]}
      {...(onPress ? { onPress, activeOpacity: 0.8 } : {})}
    >
      {icon && <View style={[styles.iconContainer, isVertical && styles.iconContainerVertical]}>{icon}</View>}
      <View style={styles.textContainer}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={[styles.title, isVertical && styles.titleLarge]}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={isVertical ? undefined : 2}>
            {subtitle}
          </Text>
        )}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </CardContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Tokens.colors.surfaceLow,
    borderRadius: Tokens.radius.cardLarge,
    padding: Tokens.spacing.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Tokens.spacing[16],
  },
  containerVertical: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: Tokens.spacing[16],
  },
  iconContainerVertical: {
    marginRight: 0,
    marginBottom: Tokens.spacing[12],
  },
  textContainer: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: Tokens.typography.fontSize.micro,
    color: Tokens.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Tokens.spacing[8],
  },
  title: {
    fontFamily: Tokens.typography.fontFamily.semiBold,
    fontSize: Tokens.typography.fontSize.h3,
    color: Tokens.colors.textPrimary,
    marginBottom: Tokens.spacing[4],
  },
  titleLarge: {
    fontSize: Tokens.typography.fontSize.h2,
    marginBottom: Tokens.spacing[8],
  },
  subtitle: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.label,
    color: Tokens.colors.textMuted,
  },
  description: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.body,
    color: Tokens.colors.textMuted,
    lineHeight: 22,
    marginTop: Tokens.spacing[4],
  },
})
