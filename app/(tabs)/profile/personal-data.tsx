import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Screen } from '../../../src/shared/components/layout/Screen'
import { Tokens } from '../../../src/shared/constants/tokens'
import { MOCK_DATA } from '../../../src/shared/utils/mockData'
import { Config } from '../../../src/shared/constants/config'

const TAB_BAR_CLEARANCE = 24

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.backButton} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.backChevron}>‹</Text>
      <Text style={styles.backLabel}>Perfil</Text>
    </TouchableOpacity>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

export default function PersonalDataScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const profile = Config.DEMO_UI_MODE ? MOCK_DATA.profile : null

  const name = profile?.name ?? '—'
  const email = profile?.email ?? '—'
  const memberSince = profile?.membershipDate ?? '—'

  return (
    <Screen>
      <View style={[styles.navBar, { marginTop: Tokens.spacing[8] }]}>
        <BackButton onPress={() => router.back()} />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>DATOS{'\n'}PERSONALES</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {Config.DEMO_UI_MODE && (
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>MODO DEMO</Text>
          </View>
        )}

        <View style={styles.block}>
          <Text style={styles.blockTitle}>IDENTIDAD</Text>
          <View style={styles.blockBody}>
            <InfoRow label="Nombre" value={name} />
            <View style={styles.separator} />
            <InfoRow label="Correo" value={email} />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>MEMBRESÍA</Text>
          <View style={styles.blockBody}>
            <InfoRow label="Iglesia" value="Iglesia Adoración" />
            <View style={styles.separator} />
            <InfoRow label="Miembro desde" value={memberSince} />
            <View style={styles.separator} />
            <InfoRow label="Rol" value="Miembro" />
          </View>
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  navBar: {
    paddingHorizontal: Tokens.spacing.screenPadding,
    paddingBottom: Tokens.spacing[8],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
  },
  backChevron: {
    fontSize: 22,
    color: Tokens.colors.primary,
    lineHeight: 26,
    fontFamily: Tokens.typography.fontFamily.regular,
  },
  backLabel: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: Tokens.typography.fontSize.body,
    color: Tokens.colors.primary,
  },

  titleBlock: {
    paddingHorizontal: Tokens.spacing.screenPadding,
    paddingBottom: Tokens.spacing[24],
  },
  title: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: Tokens.typography.fontSize.display,
    color: Tokens.colors.textPrimary,
    textTransform: 'uppercase',
    lineHeight: Tokens.typography.fontSize.display * 0.9,
  },

  scrollContent: {
    paddingHorizontal: Tokens.spacing.screenPadding,
    gap: Tokens.spacing[24],
  },

  demoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74, 218, 218, 0.10)',
    borderRadius: Tokens.radius.chip,
    paddingHorizontal: Tokens.spacing[12],
    paddingVertical: Tokens.spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(74, 218, 218, 0.20)',
  },
  demoBadgeText: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: Tokens.typography.fontSize.micro,
    color: Tokens.colors.primary,
    letterSpacing: 1,
  },

  block: {
    gap: Tokens.spacing[8],
  },
  blockTitle: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: Tokens.typography.fontSize.micro,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingLeft: Tokens.spacing[4],
  },
  blockBody: {
    backgroundColor: Tokens.colors.surfaceLow,
    borderRadius: Tokens.radius.cardLarge,
    borderWidth: 1,
    borderColor: 'rgba(229, 223, 253, 0.05)',
    overflow: 'hidden',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Tokens.spacing[16],
    paddingVertical: 14,
  },
  infoLabel: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.body,
    color: Tokens.colors.textMuted,
  },
  infoValue: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: Tokens.typography.fontSize.body,
    color: Tokens.colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(229, 223, 253, 0.05)',
    marginHorizontal: Tokens.spacing[16],
  },
})
