import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../src/shared/components/layout/Screen'
import { AppHeader } from '../../../src/shared/components/ui/AppHeader'
import { Tokens } from '../../../src/shared/constants/tokens'
import { Ionicons } from '@expo/vector-icons'

const SECTIONS = [
  {
    key: 'prayer-requests',
    title: 'Peticiones de Oración',
    subtitle: 'Comparte y ora por las necesidades de la comunidad',
    route: '/(tabs)/community/prayer-requests',
  },
  {
    key: 'channels',
    title: 'Canales',
    subtitle: 'Mensajes y avisos del liderazgo de la iglesia',
    route: '/(tabs)/community/channels',
  },
  {
    key: 'services',
    title: 'Servicios',
    subtitle: 'Horarios y ubicaciones de los cultos',
    route: '/(tabs)/community/services',
  },
]

export default function CommunityScreen() {
  const router = useRouter()

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          variant="screen"
          title="COMUNIDAD"
          subtitle="Un lugar para orar juntos y crecer en fe."
        />

        <TouchableOpacity
          style={styles.pastorHero}
          onPress={() => router.push('/(tabs)/community/channels' as never)}
          activeOpacity={0.86}
        >
          <View style={styles.pastorHeroTop}>
            <View style={styles.pastorIcon}>
              <Ionicons name="megaphone-outline" size={24} color={Tokens.colors.primary} />
            </View>
            <Text style={styles.pastorEyebrow}>CANAL PRINCIPAL</Text>
          </View>
          <Text style={styles.pastorTitle}>Canal del pastor</Text>
          <Text style={styles.pastorSubtitle}>
            Mensajes, dirección espiritual y comunicaciones importantes para toda la iglesia.
          </Text>
          <View style={styles.pastorCta}>
            <Text style={styles.pastorCtaText}>ENTRAR AL CANAL</Text>
            <Ionicons name="arrow-forward" size={16} color={Tokens.colors.primary} />
          </View>
        </TouchableOpacity>

        <View style={styles.sections}>
          {SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.key}
              style={styles.card}
              onPress={() => router.push(section.route as never)}
              activeOpacity={0.82}
            >
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Text style={styles.cardSubtitle}>{section.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Tokens.spacing[48],
  },
  sections: {
    paddingHorizontal: Tokens.spacing.screenPadding,
    gap: Tokens.spacing[16],
  },
  pastorHero: {
    marginHorizontal: Tokens.spacing.screenPadding,
    marginBottom: 20,
    backgroundColor: 'rgba(15, 223, 223, 0.07)',
    borderRadius: 30,
    padding: Tokens.spacing[24],
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.2)',
  },
  pastorHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  pastorIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 223, 223, 0.1)',
  },
  pastorEyebrow: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 10,
    color: Tokens.colors.primary,
    letterSpacing: 1.4,
  },
  pastorTitle: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 42,
    lineHeight: 40,
    color: Tokens.colors.textPrimary,
    textTransform: 'uppercase',
  },
  pastorSubtitle: {
    marginTop: 8,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Tokens.colors.textSecondary,
  },
  pastorCta: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pastorCtaText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 11,
    color: Tokens.colors.primary,
    letterSpacing: 1.2,
  },
  card: {
    backgroundColor: Tokens.colors.surfaceLow,
    borderRadius: Tokens.radius.cardLarge,
    padding: Tokens.spacing[24],
  },
  cardTitle: {
    fontFamily: Tokens.typography.fontFamily.semiBold,
    fontSize: Tokens.typography.fontSize.h3,
    color: Tokens.colors.textPrimary,
    marginBottom: Tokens.spacing[8],
  },
  cardSubtitle: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.body,
    color: Tokens.colors.textMuted,
    lineHeight: Tokens.typography.fontSize.body * 1.5,
  },
})
