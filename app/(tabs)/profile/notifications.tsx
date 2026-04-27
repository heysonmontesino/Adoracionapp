import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../src/shared/components/layout/Screen'
import { Tokens } from '../../../src/shared/constants/tokens'
import { Ionicons } from '@expo/vector-icons'
import { Config } from '../../../src/shared/constants/config'

function InfoRow({ label, value, isPlaceholder = true }: { label: string; value: string; isPlaceholder?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, isPlaceholder && styles.rowValuePlaceholder]}>{value}</Text>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBlock}>
        {children}
      </View>
    </View>
  )
}

export default function NotificationsScreen() {
  const router = useRouter()
  const isDemo = Config.DEMO_UI_MODE

  return (
    <Screen withPadding>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Tokens.colors.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>NOTIFICACIONES</Text>
          {isDemo && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>MODO DEMO</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Section title="ESTADO ACTUAL">
          <InfoRow label="Notificaciones push" value="No configuradas" />
          <View style={styles.separator} />
          <InfoRow label="Recordatorios" value="No activos" />
          <View style={styles.separator} />
          <InfoRow label="Anuncios de iglesia" value="En próxima versión" />
        </Section>

        <Section title="PREFERENCIAS">
          <InfoRow label="Transmisiones en vivo" value="Próximamente" />
          <View style={styles.separator} />
          <InfoRow label="Nuevos mensajes/prédicas" value="Próximamente" />
          <View style={styles.separator} />
          <InfoRow label="Comunidad y avisos" value="Próximamente" />
        </Section>

        <Section title="INFORMACIÓN">
          <View style={styles.infoBlock}>
            <Ionicons name="information-circle-outline" size={20} color="rgba(255, 255, 255, 0.4)" />
            <Text style={styles.infoText}>
              En esta versión preliminar, la configuración personalizada de notificaciones no está habilitada. Recibirás avisos críticos del sistema por defecto.
            </Text>
          </View>
        </Section>

        <View style={styles.footer}>
          <TouchableOpacity disabled style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Configurar notificaciones / Próximamente</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    marginBottom: 32,
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
    lineHeight: 36,
  },
  demoBadge: {
    backgroundColor: 'rgba(15, 223, 223, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  demoBadgeText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 8,
    color: Tokens.colors.primary,
    letterSpacing: 1,
  },
  scrollContent: {
    gap: 24,
    paddingBottom: 40,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingLeft: 4,
  },
  sectionBlock: {
    backgroundColor: 'rgba(22, 19, 42, 0.4)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rowLabel: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 15,
    color: Tokens.colors.textPrimary,
  },
  rowValue: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 14,
    color: Tokens.colors.primary,
  },
  rowValuePlaceholder: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 20,
  },
  infoBlock: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
  },
  infoText: {
    flex: 1,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 20,
  },
  footer: {
    marginTop: 8,
  },
  ctaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  ctaButtonText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
  },
})
