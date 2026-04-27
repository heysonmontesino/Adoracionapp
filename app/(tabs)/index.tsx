import { useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View, StyleSheet, Image, Linking, Alert, Modal, Pressable } from 'react-native'
import { Screen } from '../../src/shared/components/layout/Screen'
import { Tokens } from '../../src/shared/constants/tokens'
import { useHomeData } from '../../src/features/home/hooks/useHomeData'
import { EmptyState } from '../../src/shared/components/feedback/EmptyState'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { CHURCH_YOUTUBE } from '../../src/shared/constants/church'
import { ShareablePhraseCard } from '../../src/features/home/components/ShareablePhraseCard'
import { getDailyMotivationalPhrase } from '../../src/features/progress/constants/motivationalPhrases'
import { useProgress } from '../../src/features/progress/hooks/useProgress'
import { buildProgressSnapshot } from '../../src/features/progress/engine/progressEngine'
import { useAuthStore } from '../../src/features/auth/store'

const DONATION_PORTAL_URL = 'https://adoracion.co/diezmos-ofrendas/'

async function openDonationPortal(): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(DONATION_PORTAL_URL)
    if (!supported) {
      Alert.alert('', 'No pudimos abrir el portal de aportes en este momento.')
      return
    }
    await Linking.openURL(DONATION_PORTAL_URL)
  } catch {
    Alert.alert('', 'No pudimos abrir el portal de aportes en este momento.')
  }
}

async function openYouTubeURL(url: string): Promise<void> {
  const appUrl = url.replace('https://', 'youtube://')
  try {
    const supported = await Linking.canOpenURL(appUrl)
    await Linking.openURL(supported ? appUrl : url)
  } catch {
    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('Sin conexión', 'No se pudo abrir YouTube. Verifica tu internet.')
    }
  }
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate()
  }
  return null
}

function formatDate(value: unknown): string {
  const date = toDate(value)
  if (!date) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatDuration(duration?: string | null): string | null {
  if (!duration) return null
  if (!duration.startsWith('PT')) return duration

  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return duration

  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const seconds = Number(match[3] ?? 0)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const DAILY_VERSE = {
  reference: 'Salmos 119:105',
  text: 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.',
}

const LIVE_STATUS = {
  isActive: false,
  title: 'Servicio en vivo',
  subtitle: 'Cuando la transmisión esté activa podrás entrar desde aquí.',
  url: CHURCH_YOUTUBE.liveUrl,
  thumbnailUrl: null as string | null,
}


export default function HomeScreen() {
  const router = useRouter()
  const [isDonationModalVisible, setDonationModalVisible] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState<'bancolombia' | 'bbva' | null>(null)

  const copyAccount = async (number: string, bank: 'bancolombia' | 'bbva') => {
    try {
      const Clipboard = await import('expo-clipboard')
      await Clipboard.setStringAsync(number)
      setCopiedAccount(bank)
      setTimeout(() => setCopiedAccount(null), 2200)
    } catch {
      Alert.alert('No se pudo copiar', 'Puedes copiar el número de cuenta manualmente.')
    }
  }
  const { data, isLoading, isError, refetch } = useHomeData()
  const { data: progressData, isLoading: isProgressLoading } = useProgress()
  const user = useAuthStore((s) => s.user)
  const dailyPhrase = getDailyMotivationalPhrase()
  const latestSermon = data?.latestSermon
  const pastorMessage = data?.pastorMessage
  const latestSermonDuration = formatDuration(latestSermon?.duration)

  // Calcluate real progress snapshot
  const progressSnapshot = progressData ? buildProgressSnapshot(progressData.xp, progressData.streakDays) : null

  if (isLoading || isProgressLoading) return <Screen><View style={styles.center}><Text style={styles.loading}>Cargando...</Text></View></Screen>
  if (isError) return <Screen><EmptyState title="Error" message="No pudimos cargar el inicio" actionLabel="Reintentar" onAction={refetch} /></Screen>
  if (!data || !progressSnapshot) return <Screen><EmptyState message="No hay datos" /></Screen>

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Section: Greeting + Live pill */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>BIENVENIDO A CASA</Text>
            <Text style={styles.userName} numberOfLines={1}>{(user?.displayName || 'USUARIO').toUpperCase()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.liveButton, LIVE_STATUS.isActive ? styles.liveButtonActive : styles.liveButtonInactive]}
            activeOpacity={0.82}
            accessibilityLabel={LIVE_STATUS.isActive ? 'Transmisión en vivo activa, toca para unirte' : 'Sin transmisión activa'}
            onPress={() => {
              if (LIVE_STATUS.isActive) {
                openYouTubeURL(LIVE_STATUS.url)
              } else {
                Alert.alert(
                  'Sin transmisión',
                  'Aún no hay transmisión activa. Cuando la iglesia esté en vivo podrás entrar desde aquí.',
                )
              }
            }}
          >
            {LIVE_STATUS.isActive && <View style={styles.liveDot} />}
            <Ionicons
              name={LIVE_STATUS.isActive ? 'radio' : 'radio-outline'}
              size={14}
              color={LIVE_STATUS.isActive ? Tokens.colors.primary : 'rgba(255,255,255,0.45)'}
            />
            <Text style={[styles.liveButtonText, LIVE_STATUS.isActive && styles.liveButtonTextActive]}>
              {LIVE_STATUS.isActive ? 'LIVE' : 'En vivo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verse of the Day */}
        <View style={styles.verseCard}>
          <View style={styles.cardEyebrowRow}>
            <Ionicons name="book-outline" size={16} color={Tokens.colors.primary} />
            <Text style={styles.cardEyebrow}>VERSÍCULO DEL DÍA</Text>
          </View>
          <Text style={styles.verseText}>"{DAILY_VERSE.text}"</Text>
          <Text style={styles.verseReference}>{DAILY_VERSE.reference}</Text>
        </View>

        {/* Daily Commitment CTA */}
        <TouchableOpacity
          style={styles.dailyGoalCard}
          activeOpacity={0.86}
          onPress={() => router.push('/(tabs)/progress' as never)}
        >
          <View style={styles.dailyGoalIcon}>
            <Ionicons name="checkmark-done-outline" size={22} color={Tokens.colors.primary} />
          </View>
          <View style={styles.dailyGoalText}>
            <Text style={styles.dailyGoalTitle}>¿Ya oraste hoy?</Text>
            <Text style={styles.dailyGoalSubtitle}>Completa tus objetivos del día y fortalece tu disciplina.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={Tokens.colors.primary} />
        </TouchableOpacity>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>NIVEL DE CRECIMIENTO</Text>
              <Text style={styles.levelName}>{progressSnapshot.stage.visibleName}</Text>
            </View>
            <Text style={styles.percentage}>{Math.round(progressSnapshot.progressPctInStage * 100)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.round(progressSnapshot.progressPctInStage * 100)}%` }]} />
          </View>
          <Text style={styles.progressFooter}>
            {progressSnapshot.nextStage === null
              ? 'Has alcanzado la etapa cumbre. ¡Sigue perseverando!'
              : `Te faltan ${(progressSnapshot.xpToNextStage || 0).toLocaleString()} XP para alcanzar la etapa "${progressSnapshot.nextStage?.visibleName}".`}
          </Text>
        </View>

        {/* Giving */}
        <TouchableOpacity
          style={styles.givingCard}
          activeOpacity={0.86}
          onPress={() => setDonationModalVisible(true)}
        >
          <View style={styles.givingHeader}>
            <View style={styles.givingIcon}>
              <Ionicons name="gift-outline" size={20} color={Tokens.colors.primary} />
            </View>
            <Text style={styles.givingTag}>DIEZMOS · OFRENDAS · DONACIONES</Text>
          </View>
          <Text style={styles.givingTitle}>Honra a Dios con generosidad</Text>
          <Text style={styles.givingSubtitle}>Consulta los datos oficiales para realizar tu aporte de forma segura.</Text>
          <Text style={styles.givingCta}>VER INFORMACIÓN</Text>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/bible')}
          >
            <Ionicons name="book" size={24} color={Tokens.colors.primary} />
            <Text style={styles.actionTitle}>Biblia</Text>
            <Text style={styles.actionSubtitle}>LEE LA PALABRA</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/community/prayer-requests')}
          >
            <Ionicons name="heart" size={24} color={Tokens.colors.primary} />
            <Text style={styles.actionTitle}>Peticiones</Text>
            <Text style={styles.actionSubtitle}>ORAMOS POR TI</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Message (Pastor) */}
        {pastorMessage ? (
          <TouchableOpacity
            style={styles.featuredStory}
            activeOpacity={pastorMessage.ctaUrl ? 0.9 : 1}
            disabled={!pastorMessage.ctaUrl}
            onPress={() => pastorMessage.ctaUrl ? Linking.openURL(pastorMessage.ctaUrl) : undefined}
          >
            {pastorMessage.imageUrl ? (
              <Image
                source={{ uri: pastorMessage.imageUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : null}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.48)' }]} />
            <View style={styles.storyOverlay}>
              <Text style={styles.storyTag}>MENSAJE DEL PASTOR</Text>
              <Text style={styles.storyTitle}>{pastorMessage.title}</Text>
              <Text style={styles.storyQuote}>{pastorMessage.excerpt}</Text>
              {pastorMessage.ctaLabel && pastorMessage.ctaUrl ? (
                <Text style={styles.storyCta}>{pastorMessage.ctaLabel}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Latest Sermon */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ÚLTIMA PRÉDICA</Text>
          <TouchableOpacity onPress={() => router.push('/content')}><Text style={styles.seeAllText}>VER TODAS</Text></TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.sermonCard} 
          activeOpacity={0.9}
          onPress={() => openYouTubeURL(latestSermon?.videoUrl ?? CHURCH_YOUTUBE.videosUrl)}
        >
          <View style={styles.videoPlaceholder}>
            {latestSermon?.thumbnailUrl ? (
              <Image
                source={{ uri: latestSermon.thumbnailUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : null}
            {latestSermon?.thumbnailUrl ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.22)' }]} />
            ) : null}
            <View style={styles.playOverlay}>
              <Ionicons name="play" size={32} color={Tokens.colors.primary} />
            </View>
            {latestSermonDuration ? (
              <View style={styles.durationBadge}><Text style={styles.durationText}>{latestSermonDuration}</Text></View>
            ) : null}
          </View>
          <View style={styles.sermonInfo}>
            <Text style={styles.sermonTitle}>
              {latestSermon?.title ?? 'Ver la prédica más reciente en YouTube'}
            </Text>
            <Text style={styles.sermonMeta}>
              {latestSermon
                ? `${formatDate(latestSermon.publishedAt)}${latestSermon.preacherName ? ` • ${latestSermon.preacherName}` : ''}`
                : 'No pudimos actualizar la card ahora mismo. Abre el canal oficial para verla.'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Frase del día — Hero Shareable Card */}
        <ShareablePhraseCard 
          phrase={dailyPhrase} 
          onSharePress={() => {
            Alert.alert(
              "Compartir en Historias",
              "Esta funcionalidad estará lista pronto para que puedas compartir esta palabra en tus redes sociales."
            )
          }}
        />

      </ScrollView>

      <Modal
        visible={isDonationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDonationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDonationModalVisible(false)} />
          <View style={styles.donationModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalEyebrow}>APORTES</Text>
            <Text style={styles.modalTitle}>Diezmos, ofrendas y donaciones</Text>
            <Text style={styles.modalBody}>
              Puedes realizar tu aporte usando los datos oficiales de la iglesia o continuar al portal de aportes en línea.
            </Text>

            {/* Bancolombia */}
            <View style={styles.bankSection}>
              <Text style={styles.bankLabel}>BANCOLOMBIA</Text>
              <Text style={styles.bankDetail}>Cuenta de ahorros: 248-000003-75</Text>
              <TouchableOpacity
                style={styles.copyButton}
                activeOpacity={0.78}
                onPress={() => copyAccount('248-000003-75', 'bancolombia')}
              >
                <Ionicons
                  name={copiedAccount === 'bancolombia' ? 'checkmark-circle' : 'copy-outline'}
                  size={15}
                  color={copiedAccount === 'bancolombia' ? '#4ade80' : Tokens.colors.primary}
                />
                <Text style={[styles.copyButtonText, copiedAccount === 'bancolombia' && styles.copyButtonTextDone]}>
                  {copiedAccount === 'bancolombia' ? 'Cuenta copiada' : 'Copiar cuenta Bancolombia'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* BBVA */}
            <View style={styles.bankSection}>
              <Text style={styles.bankLabel}>BBVA</Text>
              <Text style={styles.bankDetail}>Cuenta corriente: 092025204</Text>
              <TouchableOpacity
                style={styles.copyButton}
                activeOpacity={0.78}
                onPress={() => copyAccount('092025204', 'bbva')}
              >
                <Ionicons
                  name={copiedAccount === 'bbva' ? 'checkmark-circle' : 'copy-outline'}
                  size={15}
                  color={copiedAccount === 'bbva' ? '#4ade80' : Tokens.colors.primary}
                />
                <Text style={[styles.copyButtonText, copiedAccount === 'bbva' && styles.copyButtonTextDone]}>
                  {copiedAccount === 'bbva' ? 'Cuenta copiada' : 'Copiar cuenta BBVA'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Support note */}
            <View style={styles.donationNote}>
              <Ionicons name="mail-outline" size={13} color="rgba(255,255,255,0.4)" style={{ marginTop: 2 }} />
              <Text style={styles.donationNoteText}>
                Después de realizar tu transferencia o consignación, envía el soporte a{' '}
                <Text style={styles.donationNoteEmail}>adoracion.iglesia@gmail.com</Text>
                {' '}para registrarlo a tu nombre.
              </Text>
            </View>

            {/* Online portal */}
            <TouchableOpacity style={styles.onlineButton} activeOpacity={0.86} onPress={openDonationPortal}>
              <Ionicons name="globe-outline" size={17} color="#0D0B14" />
              <Text style={styles.onlineButtonText}>APORTAR EN LÍNEA</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setDonationModalVisible(false)}>
              <Text style={styles.modalCloseText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loading: { color: Tokens.colors.textPrimary, fontFamily: Tokens.typography.fontFamily.medium },
  scrollContent: {
    paddingHorizontal: Tokens.spacing.screenPadding,
    paddingTop: Tokens.spacing[24],
    paddingBottom: Tokens.spacing[48],
    gap: Tokens.spacing[24],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Tokens.spacing[8],
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  liveButtonActive: {
    backgroundColor: 'rgba(15, 223, 223, 0.14)',
    borderWidth: 1,
    borderColor: Tokens.colors.primary,
  },
  liveButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  liveButtonText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
  },
  liveButtonTextActive: {
    color: Tokens.colors.primary,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Tokens.colors.primary,
  },
  cardEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardEyebrow: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 10,
    color: Tokens.colors.primary,
    letterSpacing: 1.4,
  },
  verseCard: {
    backgroundColor: 'rgba(15, 223, 223, 0.06)',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.18)',
  },
  verseText: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 18,
    lineHeight: 28,
    color: Tokens.colors.textPrimary,
  },
  verseReference: {
    marginTop: 14,
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 12,
    color: Tokens.colors.primary,
    letterSpacing: 1,
  },
  dailyGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.055)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dailyGoalIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: 'rgba(15, 223, 223, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyGoalText: {
    flex: 1,
  },
  dailyGoalTitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 17,
    color: Tokens.colors.textPrimary,
  },
  dailyGoalSubtitle: {
    marginTop: 3,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.56)',
  },
  welcomeText: {
    fontFamily: Tokens.typography.fontFamily.semiBold,
    fontSize: Tokens.typography.fontSize.label,
    color: Tokens.colors.primary,
    letterSpacing: 1.2,
  },
  userName: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 56,
    color: Tokens.colors.textPrimary,
    lineHeight: 52,
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  progressLabel: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
  levelName: {
    fontFamily: Tokens.typography.fontFamily.semiBold,
    fontSize: 20,
    color: Tokens.colors.textPrimary,
  },
  percentage: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 32,
    color: Tokens.colors.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Tokens.colors.primary,
    borderRadius: 3,
  },
  progressFooter: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 18,
  },
  givingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.14)',
  },
  givingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  givingIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 223, 223, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  givingTag: {
    flex: 1,
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 10,
    color: Tokens.colors.primary,
    letterSpacing: 1,
  },
  givingTitle: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 34,
    lineHeight: 32,
    color: Tokens.colors.textPrimary,
  },
  givingSubtitle: {
    marginTop: 8,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  givingCta: {
    marginTop: 18,
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 11,
    color: Tokens.colors.primary,
    letterSpacing: 1.4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionTitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 16,
    color: Tokens.colors.textPrimary,
    marginTop: 12,
  },
  actionSubtitle: {
    fontFamily: Tokens.typography.fontFamily.semiBold,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  featuredStory: {
    height: 240,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#25213D',
  },
  storyOverlay: {
    padding: 24,
  },
  storyTag: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 10,
    color: Tokens.colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  storyTitle: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 32,
    color: Tokens.colors.textPrimary,
    lineHeight: 30,
    marginBottom: 8,
  },
  storyQuote: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 19,
  },
  storyCta: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 11,
    color: Tokens.colors.primary,
    letterSpacing: 1,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 28,
    color: Tokens.colors.textPrimary,
  },
  seeAllText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 12,
    color: Tokens.colors.primary,
  },
  sermonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  videoPlaceholder: {
    height: 180,
    backgroundColor: '#25213D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(15, 223, 223, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontFamily: Tokens.typography.fontFamily.bold,
  },
  sermonInfo: {
    padding: 16,
  },
  sermonTitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 18,
    color: Tokens.colors.textPrimary,
  },
  sermonMeta: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  donationModal: {
    backgroundColor: '#171426',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 42,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalEyebrow: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 10,
    color: Tokens.colors.primary,
    letterSpacing: 1.5,
  },
  modalTitle: {
    marginTop: 6,
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 36,
    lineHeight: 34,
    color: Tokens.colors.textPrimary,
  },
  modalBody: {
    marginTop: 12,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.66)',
  },
  bankSection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 6,
  },
  bankLabel: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 10,
    color: Tokens.colors.primary,
    letterSpacing: 1.2,
  },
  bankDetail: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 15,
    color: Tokens.colors.textPrimary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  copyButtonText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 12,
    color: Tokens.colors.primary,
    letterSpacing: 0.5,
  },
  copyButtonTextDone: {
    color: '#4ade80',
  },
  donationNote: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 2,
  },
  donationNoteText: {
    flex: 1,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.45)',
  },
  donationNoteEmail: {
    fontFamily: Tokens.typography.fontFamily.medium,
    color: 'rgba(255,255,255,0.6)',
  },
  onlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    height: 50,
    borderRadius: 16,
    backgroundColor: Tokens.colors.primary,
  },
  onlineButtonText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 12,
    color: '#0D0B14',
    letterSpacing: 1.2,
  },
  modalCloseButton: {
    marginTop: 22,
    height: 54,
    borderRadius: 18,
    backgroundColor: Tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 12,
    color: '#0D0B14',
    letterSpacing: 1.2,
  },
})
