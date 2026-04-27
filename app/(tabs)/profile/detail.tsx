import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen } from '../../../src/shared/components/layout/Screen'
import { Tokens } from '../../../src/shared/constants/tokens'
import { Ionicons } from '@expo/vector-icons'

export default function ProfileDetailScreen() {
  const { title } = useLocalSearchParams<{ title: string }>()
  const router = useRouter()

  return (
    <Screen withPadding>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Tokens.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{title?.toUpperCase() || 'DETALLE'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="construct-outline" size={48} color={Tokens.colors.primary} />
        </View>
        <Text style={styles.messageTitle}>PRÓXIMAMENTE</Text>
        <Text style={styles.messageSubtitle}>
          Estamos trabajando para que puedas gestionar tu {title?.toLowerCase()} muy pronto.
        </Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 32,
    color: Tokens.colors.textPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(15, 223, 223, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  messageTitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 20,
    color: Tokens.colors.textPrimary,
    marginBottom: 8,
  },
  messageSubtitle: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
})
