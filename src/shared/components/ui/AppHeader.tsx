import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Tokens } from '../../constants/tokens'
import { Ionicons } from '@expo/vector-icons'

type HeaderVariant = 'hero' | 'screen'

interface AppHeaderProps {
  variant: HeaderVariant
  title: string
  subtitle?: string
  showActions?: boolean
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
}

export function AppHeader({ 
  variant, 
  title, 
  subtitle, 
  showActions, 
  leftAction, 
  rightAction 
}: AppHeaderProps) {
  return (
    <View
      style={[
        styles.container,
        variant === 'screen' && { marginTop: Tokens.spacing[12] },
        variant === 'hero' && { marginTop: Tokens.spacing[48] },
      ]}
    >
      <View style={styles.headerContent}>
        {leftAction && (
          <View style={styles.leftActionContainer}>
            {leftAction}
          </View>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={variant === 'hero' ? styles.titleHero : styles.titleScreen}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                variant === 'hero' ? styles.subtitleHero : styles.subtitleScreen,
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {(showActions || rightAction) && (
          <View style={styles.actions}>
            {rightAction}
            {showActions && !rightAction && (
              <>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="search-outline" size={24} color={Tokens.colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="notifications-outline" size={24} color={Tokens.colors.textPrimary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Tokens.spacing.screenPadding,
    marginBottom: Tokens.spacing[24],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  leftActionContainer: {
    marginRight: Tokens.spacing[16],
    marginTop: Tokens.spacing[4], // Align with first line of title
  },
  actions: {
    flexDirection: 'row',
    gap: Tokens.spacing[8],
    marginTop: Tokens.spacing[8],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 223, 253, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleHero: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: Tokens.typography.fontSize.display,
    color: Tokens.colors.textPrimary,
    textTransform: 'uppercase',
    lineHeight: Tokens.typography.fontSize.display * 0.9,
    marginBottom: Tokens.spacing[8],
  },
  titleScreen: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: Tokens.typography.fontSize.h1 + 16, // approx 44
    color: Tokens.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    lineHeight: 52, // Increased from 44 to give more vertical space for display font
    marginBottom: Tokens.spacing[4],
  },
  subtitle: {
    fontFamily: Tokens.typography.fontFamily.regular,
    color: Tokens.colors.textMuted,
  },
  subtitleHero: {
    fontSize: Tokens.typography.fontSize.body,
  },
  subtitleScreen: {
    fontSize: Tokens.typography.fontSize.label,
  },
})
