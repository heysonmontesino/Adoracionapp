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

function InfoRow({ label, value, dimValue }: { label: string; value: string; dimValue?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, dimValue && styles.infoValueDim]}>{value}</Text>
    </View>
  )
}

export default function AccountScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const profile = Config.DEMO_UI_MODE ? MOCK_DATA.profile : null

  const email = profile?.email ?? 'No disponible'
  const accessMode = Config.DEMO_UI_MODE ? 'Demo' : 'Normal'
  const accountType = 'Miembro'
  const accountStatus = 'Activa'

  return (
    <Screen>
      <View style={styles.navBar}>
        <BackButton onPress={() => router.back()} />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>CUENTA</Text>
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
          <Text style={styles.blockTitle}>ESTADO DE CUENTA</Text>
          <View style={styles.blockBody}>
            <InfoRow label="Tipo de cuenta" value={accountType} />
            <View style={styles.separator} />
            <InfoRow label="Estado" value={accountStatus} />
            <View style={styles.separator} />
            <InfoRow label="Acceso actual" value={accessMode} />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>SESIÓN</Text>
          <View style={styles.blockBody}>
            <InfoRow label="Correo" value={email} />
            <View style={styles.separator} />
            <InfoRow label="Modo de acceso" value={accessMode} />
            <View style={styles.separator} />
            <InfoRow label="Última sesión" value="No disponible" dimValue />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>SEGURIDAD</Text>
          <View style={styles.blockBody}>
            <InfoRow label="Autenticación" value="No configurada" dimValue />
            <View style={styles.separator} />
            <InfoRow label="Recuperación" value="No disponible en esta versión" dimValue />
          </View>
        </View>

        <View style={styles.ctaBlock}>
          <View style={styles.ctaDisabled}>
            <Text style={styles.ctaLabel}>Administrar cuenta</Text>
            <Text style={styles.ctaHint}>Próximamente</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  navBar: {
    paddingHorizontal: Tokens.spacing.screenPadding,
    paddingTop: Tokens.spacing[8],
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
  infoValueDim: {
    color: 'rgba(229, 223, 253, 0.35)',
    fontFamily: Tokens.typography.fontFamily.regular,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(229, 223, 253, 0.05)',
    marginHorizontal: Tokens.spacing[16],
  },

  ctaBlock: {
    marginTop: Tokens.spacing[8],
  },
  ctaDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Tokens.colors.surfaceLow,
    borderRadius: Tokens.radius.cardLarge,
    paddingHorizontal: Tokens.spacing[16],
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(229, 223, 253, 0.05)',
    opacity: 0.5,
  },
  ctaLabel: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: Tokens.typography.fontSize.body,
    color: Tokens.colors.textPrimary,
  },
  ctaHint: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: Tokens.typography.fontSize.caption,
    color: Tokens.colors.textMuted,
  },
})
