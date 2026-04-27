import React, { useRef, useState, useEffect } from 'react'
import { StyleSheet, View, Text, ScrollView, Animated, Dimensions, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../../src/shared/components/layout/Screen'
import { AppHeader } from '../../../src/shared/components/ui/AppHeader'
import { Skeleton } from '../../../src/shared/components/feedback/Skeleton'
import { Tokens } from '../../../src/shared/constants/tokens'
import {
  useProgress,
  useChallengeCompletions,
  useToggleChallenge
} from '../../../src/features/progress/hooks/useProgress'
import { buildProgressSnapshot } from '../../../src/features/progress/engine/progressEngine'
import { DAILY_CHALLENGES } from '../../../src/features/progress/constants/challenges'
import { useChallengeProgressStore, buildCompletionKey } from '../../../src/features/progress/challengeStore'
import { CharacterAsset } from '../../../src/features/progress/components/CharacterAsset'
import { STAGES } from '../../../src/features/progress/constants/stages'
import type { CharacterStage, ChallengeDefinition } from '../../../src/features/progress/types/index'
import type { CharacterGender, SpiritualStage } from '../../../src/features/character/types'
import { STAGE_BACKGROUNDS } from '../../../src/features/character/sprites/stageBackgroundConfig'
import type { AnimSequence } from '../../../src/features/progress/components/ProgressCharacter3D'
import { ProfileModal } from '../../../src/features/profile/components/ProfileModal'
import { useAuthStore } from '../../../src/features/auth/store'
import { MOCK_DATA } from '../../../src/shared/utils/mockData'
import { Config } from '../../../src/shared/constants/config'

const { width } = Dimensions.get('window')
const TAB_BAR_CLEARANCE = 90
const SECTION_GAP = 28
const CYAN = '#0fdfdf'
const CARD_BG = 'rgba(255, 255, 255, 0.03)'
const CARD_RADIUS = 24
const DEFAULT_PROGRESS_DATA = {
  xp: 0,
  level: 1 as const,
  streakDays: 0,
  longestStreak: 0,
  lastActivityDate: '',
  totalPrayersOffered: 0,
  stageOverride: null as number | null,
  genderOverride: null as CharacterGender | null,
}

const STAGE_BY_KEY = Object.fromEntries(
  STAGES.map((stage) => [stage.characterStage, stage])
) as Record<SpiritualStage, (typeof STAGES)[number]>

function resolveVisualStage(stageOverride: unknown, fallbackStage: (typeof STAGES)[number]) {
  if (typeof stageOverride === 'number') {
    return STAGES.find((stage) => stage.id === stageOverride) ?? fallbackStage
  }

  if (
    stageOverride === 'baby' ||
    stageOverride === 'child' ||
    stageOverride === 'young' ||
    stageOverride === 'adult' ||
    stageOverride === 'master'
  ) {
    return STAGE_BY_KEY[stageOverride] ?? fallbackStage
  }

  return fallbackStage
}

class CharacterPortraitBoundary extends React.Component<
  { children: React.ReactNode; size: number },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <View style={[spot.characterFallback, { width: this.props.size, height: this.props.size }]}>
        <Ionicons name="person-circle-outline" size={Math.min(this.props.size * 0.36, 128)} color="rgba(15, 223, 223, 0.55)" />
      </View>
    )
  }
}



// ─── Components ─────────────────────────────────────────────────────────────

function ProgressHeader({ stageId, stageName, onLabelPress }: { stageId: number, stageName: string, onLabelPress?: () => void }) {
  return (
    <Pressable onPress={onLabelPress} style={header.container}>
      <Text style={header.label}>ESTADO ESPIRITUAL</Text>
      <View style={header.row}>
        <Text style={header.stageNum}>{stageId}</Text>
        <Text style={header.stageName}>{stageName}</Text>
      </View>
    </Pressable>
  )
}

function CharacterPortrait({ 
  characterStage, 
  stageId,
  gender,
  animationTrigger,
}: { 
  characterStage: CharacterStage, 
  stageId: number,
  gender?: CharacterGender,
  animationTrigger?: { type: AnimSequence; ts: number } | null,
}) {
  // ESCALA HEROICA: Etapa 1 (360px), crece un 20% por nivel para impacto visual masivo
  const BASE_SIZE = 360
  const growthFactor = 0.20
  const scale = 1 + (stageId - 1) * growthFactor
  const charSize = BASE_SIZE * scale

  // Ambient Background Config
  const safeStage = characterStage ?? 'baby'
  const bgConfig = STAGE_BACKGROUNDS[safeStage] || STAGE_BACKGROUNDS.baby

  return (
    <View style={[spot.container, { height: charSize + 40 }]}>
      {/* Glow Ambiental Detrás del Personaje */}
      <View 
        style={[
          spot.ambientGlow, 
          { 
            backgroundColor: bgConfig.gradientBottom,
            width: charSize * 0.8,
            height: charSize * 0.8,
            borderRadius: charSize * 0.4,
            shadowColor: bgConfig.gradientBottom,
            shadowRadius: 100,
            shadowOpacity: 0.6,
          }
        ]} 
      />
      
      <View style={spot.characterAnchor}>
        <View style={[spot.characterWrapper, { width: charSize, height: charSize }]}>
          <CharacterPortraitBoundary size={charSize}>
            <CharacterAsset 
              characterStage={safeStage} 
              gender={gender} 
              size={charSize} // Forzamos el tamaño exacto sin mediciones
              animationTrigger={animationTrigger}
            />
          </CharacterPortraitBoundary>
        </View>
      </View>
    </View>
  )
}

function ProgressStats({ progressPct, currentXp, nextLevelXp }: { progressPct: number, currentXp: number, nextLevelXp: number }) {
  const animatedWidth = useRef(new Animated.Value(progressPct)).current
  const pctDisplay = Math.round(progressPct * 100)

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progressPct,
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [progressPct])

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={stats.container}>
      <View style={stats.topInfo}>
        <Text style={stats.xpLabel}>PROGRESO DE ETAPA</Text>
        <View style={stats.badge}>
          <Text style={stats.badgeText}>{pctDisplay}%</Text>
        </View>
      </View>

      <View style={stats.barOuter}>
        <View style={stats.barContainer}>
          <Animated.View style={[stats.barFill, { width: widthInterpolation }]} />
        </View>
        <View style={stats.glow} />
      </View>

      <View style={stats.infoRow}>
        <Text style={stats.xpNumbers}>
          <Text style={stats.xpCurrent}>{currentXp.toLocaleString()}</Text>
          <Text style={stats.xpTotal}> / {nextLevelXp.toLocaleString()} XP</Text>
        </Text>
        <Text style={stats.levelStatus}>EN CAMINO</Text>
      </View>
    </View>
  )
}

function XPCard({
  xp,
  xpMax,
  progressPct,
  nextVisibleName,
  bonusXp = 0,
}: {
  xp: number
  xpMax: number
  progressPct: number
  nextVisibleName: string
  bonusXp?: number
}) {
  const remaining = xpMax + 1 - xp
  const pctDisplay = Math.round(progressPct * 100)
  const isNearLevelUp = progressPct >= 0.75

  const prevBonusRef = useRef(bonusXp)
  const [showFlash, setShowFlash] = useState(false)
  const flashAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (bonusXp > prevBonusRef.current) {
      setShowFlash(true)
      flashAnim.setValue(0)
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1100),
        Animated.timing(flashAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => setShowFlash(false))
    }
    prevBonusRef.current = bonusXp
  }, [bonusXp])

  const flashMsg = isNearLevelUp ? `Más cerca de ${nextVisibleName}` : 'Tu personaje avanzó'
  const baseHint = isNearLevelUp 
    ? `✦ Estás muy cerca de ${nextVisibleName}` 
    : bonusXp > 0 
      ? `+${bonusXp.toLocaleString()} XP ya sumados hoy` 
      : 'Completa retos para avanzar'

  return (
    <View style={xpc.card}>
      <View style={xpc.topRow}>
        <Text style={xpc.xpValue}>{xp.toLocaleString()}<Text style={xpc.xpUnit}> XP</Text></Text>
        <View style={[xpc.pctBadge, isNearLevelUp && xpc.pctBadgeNear]}>
          <Text style={[xpc.pctText, isNearLevelUp && xpc.pctTextNear]}>{pctDisplay}%</Text>
        </View>
      </View>
      <View style={[xpc.track, isNearLevelUp && xpc.trackNear]}>
        <View style={[xpc.fill, { width: `${pctDisplay}%` }, isNearLevelUp && xpc.fillNear]} />
      </View>
      <Text style={xpc.hint}>Te faltan <Text style={xpc.hintAccent}>{remaining.toLocaleString()} XP</Text> para llegar a {nextVisibleName}</Text>
      {showFlash ? (
        <Animated.Text style={[xpc.hintSub, xpc.hintFlash, { opacity: flashAnim }]}>{flashMsg}</Animated.Text>
      ) : (
        <Text style={[xpc.hintSub, isNearLevelUp && xpc.hintNear]}>{baseHint}</Text>
      )}
    </View>
  )
}

function NextMilestone({ xpToNext, nextVisibleName, nextPhrase }: { xpToNext: number, nextVisibleName: string, nextPhrase: string }) {
  return (
    <View style={milestone.card}>
      <Text style={milestone.label}>SIGUIENTE ETAPA</Text>
      <View style={milestone.nameRow}>
        <Text style={milestone.name}>{nextVisibleName}</Text>
        <View style={milestone.xpPill}>
          <Text style={milestone.xpPillText}>+{xpToNext.toLocaleString()} XP</Text>
        </View>
      </View>
      <View style={milestone.divider} />
      <Text style={milestone.phrase}>{nextPhrase}</Text>
    </View>
  )
}

function MentorCard({ phrase }: { phrase: string }) {
  return (
    <View style={mc.card}>
      <View style={mc.badgeRow}><View style={mc.badge}><Text style={mc.badgeText}>✦ ETAPA CUMBRE</Text></View></View>
      <Text style={mc.title}>Mentor</Text>
      <Text style={mc.subtitle}>Has recorrido todo el camino.</Text>
      <View style={mc.divider} />
      <Text style={mc.phrase}>{phrase}</Text>
      <View style={mc.divider} />
      <Text style={mc.closing}>"El que enseña sigue siendo enseñado."</Text>
    </View>
  )
}

const CHALLENGE_ICON: Record<string, string> = {
  'daily-bible': 'book-outline', 'daily-pray': 'heart-outline', 'daily-gratitude': 'sunny-outline',
  'daily-devotional': 'journal-outline', 'daily-intercede': 'people-outline', 'daily-night-prayer': 'moon-outline',
  'daily-sermon': 'headset-outline', 'daily-reflection': 'create-outline', 'daily-surprise': 'sparkles-outline',
  'wk-j-fast': 'time-outline', 'wk-j-extra-chapter': 'library-outline', 'wk-j-sermon': 'headset-outline',
  'wk-j-serve': 'people-outline', 'wk-j-encourage': 'chatbubble-outline', 'wk-s-fast-half': 'time-outline',
  'wk-s-psalm': 'musical-notes-outline', 'wk-s-concrete-serve': 'hand-left-outline', 'wk-s-forgive': 'ribbon-outline',
  'wk-s-share-word': 'share-outline', 'wk-s-devotional': 'journal-outline', 'mo-evangelize': 'megaphone-outline',
  'mo-bible-book': 'book-outline', 'mo-church-serve': 'home-outline', 'mo-give': 'gift-outline',
}

const ROTATING_DAILY_TASKS: ChallengeDefinition[] = [
  { id: 'daily-devotional', frequency: 'daily', title: 'Realiza un devocional', description: 'Aparta un momento breve para meditar y responder a Dios', xp: 10 },
  { id: 'daily-intercede', frequency: 'daily', title: 'Intercede por alguien más', description: 'Ora específicamente por una persona y su necesidad', xp: 10 },
  { id: 'daily-night-prayer', frequency: 'daily', title: 'Ora antes de dormir', description: 'Cierra el día entregando tus cargas a Dios', xp: 10 },
  { id: 'daily-sermon', frequency: 'daily', title: 'Escucha una prédica', description: 'Recibe dirección escuchando un mensaje de la Palabra', xp: 10 },
  { id: 'daily-reflection', frequency: 'daily', title: 'Escribe algo que Dios te enseñó hoy', description: 'Registra una enseñanza concreta de tu día', xp: 10 },
]

const SURPRISE_DAILY_TASK: ChallengeDefinition = {
  id: 'daily-surprise',
  frequency: 'daily',
  title: 'Bendice a alguien en secreto',
  description: 'Haz una acción sencilla de amor sin buscar reconocimiento',
  xp: 20,
}

function getRotatingDailyTasks(now: Date = new Date()): ChallengeDefinition[] {
  const daySeed = Math.floor(now.getTime() / 86_400_000)
  return [
    ROTATING_DAILY_TASKS[daySeed % ROTATING_DAILY_TASKS.length],
    ROTATING_DAILY_TASKS[(daySeed + 2) % ROTATING_DAILY_TASKS.length],
  ]
}

function ChallengeRow({
  challenge,
  isLast,
  isDone,
  completionKey,
  onToggleDone,
}: {
  challenge: ChallengeDefinition,
  isLast: boolean,
  isDone: boolean,
  completionKey: string,
  onToggleDone?: (isNowDone: boolean) => void,
}) {
  const { mutate: toggleChallenge, isPending } = useToggleChallenge()

  const key = completionKey
  const done = isDone
  const iconName = CHALLENGE_ICON[challenge.id] ?? 'star-outline'
  const rowScale = useRef(new Animated.Value(1)).current
  const flashAnim = useRef(new Animated.Value(0)).current
  const [showFlash, setShowFlash] = useState(false)

  const handlePress = () => {
    if (isPending) {
      console.log(`[ProgressScreen] handlePress ignored: mutation isPending for ${challenge.id}`);
      return
    }

    const isNowDone = !done
    console.log(`[ProgressScreen] handlePress triggered for challenge: ${challenge.id}. Current: ${done} -> Next: ${isNowDone}. Key: ${key}`);
    
    toggleChallenge({
      challengeId: challenge.id,
      frequency: challenge.frequency,
      xp: challenge.xp,
      isDone: isNowDone,
      completionKey: key
    })

    if (isNowDone) {
      onToggleDone?.(true)
      setShowFlash(true)
      flashAnim.setValue(0)
      Animated.sequence([
        Animated.parallel([
          Animated.spring(rowScale, { toValue: 1.025, useNativeDriver: true, speed: 40, bounciness: 3 }),
          Animated.timing(flashAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
        ]),
        Animated.delay(680),
        Animated.parallel([
          Animated.spring(rowScale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 0 }),
          Animated.timing(flashAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]),
      ]).start(() => setShowFlash(false))
    }
  }

  return (
    <Animated.View style={{ transform: [{ scale: rowScale }] }}>
      <Pressable 
        onPress={handlePress} 
        style={({ pressed }) => [
          cr.row, 
          !isLast && cr.rowBorder,
          (pressed || isPending) && { opacity: 0.7, backgroundColor: 'rgba(15, 223, 223, 0.05)' }
        ]}
      >
        <View style={[cr.iconCircle, done && cr.iconCircleDone]}>
          <Ionicons name={iconName as any} size={15} color={done ? '#0D0B14' : CYAN} />
        </View>
        <View style={cr.textBlock}>
          <Text style={[cr.title, done && cr.titleDone]}>{challenge.title}</Text>
          <Text style={cr.desc} numberOfLines={1}>{challenge.description}</Text>
        </View>
        <View style={cr.right}>
          {showFlash ? (
            <Animated.Text style={[cr.xpFlash, { opacity: flashAnim }]}>+{challenge.xp} XP</Animated.Text>
          ) : (
            <View style={[cr.xpBadge, done && cr.xpBadgeDone]}><Text style={[cr.xpText, done && cr.xpTextDone]}>+{challenge.xp} XP</Text></View>
          )}
          <View style={[cr.statusDot, done && cr.statusDotDone]}>{done && <Ionicons name="checkmark" size={11} color="#0D0B14" />}</View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

function ChallengeSection({ 
  title, 
  variant, 
  challenges,
  completions,
  onToggleDone,
}: { 
  title: string, 
  variant: 'daily' | 'weekly' | 'monthly', 
  challenges: ChallengeDefinition[],
  completions: Record<string, boolean>,
  onToggleDone?: (isNowDone: boolean) => void,
}) {
  if (challenges.length === 0) return null
  return (
    <View style={cs.container}>
      <View style={cs.header}><Text style={cs.title}>{title}</Text></View>
      <View style={cs.list}>
        {challenges.map((c, i) => {
          const completionKey = buildCompletionKey(c.id, c.frequency)
          return (
            <ChallengeRow
              key={c.id}
              challenge={c}
              isDone={completions[completionKey] ?? false}
              completionKey={completionKey}
              isLast={i === challenges.length - 1}
              onToggleDone={onToggleDone}
            />
          )
        })}
      </View>
    </View>
  )
}

function DailyCommitmentPanel({
  completions,
  streakDays,
  onToggleDone,
}: {
  completions: Record<string, boolean>
  streakDays: number
  onToggleDone?: (isNowDone: boolean) => void
}) {
  const [isSurpriseRevealed, setSurpriseRevealed] = useState(false)
  const rotatingTasks = getRotatingDailyTasks()
  const visibleTasks = [
    ...DAILY_CHALLENGES,
    ...rotatingTasks,
    ...(isSurpriseRevealed ? [SURPRISE_DAILY_TASK] : []),
  ]
  const allTasks = [...DAILY_CHALLENGES, ...rotatingTasks, SURPRISE_DAILY_TASK]
  const completedCount = allTasks.filter((task) => completions[buildCompletionKey(task.id, task.frequency)]).length
  const remaining = Math.max(6 - completedCount, 0)
  const dailyTaskXp = allTasks
    .filter((task) => completions[buildCompletionKey(task.id, task.frequency)])
    .reduce((total, task) => total + task.xp, 0)
  const dayBonus = completedCount >= 6 ? 50 : completedCount >= 3 ? 20 : 0
  const streakBonus = streakDays >= 30 ? 500 : streakDays >= 7 ? 100 : 0
  const projectedXp = dailyTaskXp + dayBonus + streakBonus
  const status =
    completedCount >= 6 ? 'Día perfecto' :
    completedCount >= 5 ? 'Día destacado' :
    completedCount >= 3 ? 'Día cumplido' :
    'En progreso'
  const message =
    completedCount >= 6 ? 'Hoy fortaleciste tu disciplina con un día perfecto.' :
    completedCount >= 3 ? 'Hoy fortaleciste tu disciplina.' :
    remaining === 1 ? 'Te falta 1 tarea para completar tu día.' :
    `Te faltan ${remaining} tareas para completar tu día.`

  return (
    <View style={daily.card}>
      <View style={daily.header}>
        <View>
          <Text style={daily.eyebrow}>COMPROMISO DIARIO</Text>
          <Text style={daily.title}>Objetivos de hoy</Text>
        </View>
        <View style={daily.streakPill}>
          <Ionicons name="flame-outline" size={14} color={CYAN} />
          <Text style={daily.streakText}>{streakDays} días</Text>
        </View>
      </View>

      <View style={daily.summaryRow}>
        <View style={daily.summaryBox}>
          <Text style={daily.summaryValue}>{completedCount}/6</Text>
          <Text style={daily.summaryLabel}>Tareas</Text>
        </View>
        <View style={daily.summaryBox}>
          <Text style={daily.summaryValue}>{status}</Text>
          <Text style={daily.summaryLabel}>Estado</Text>
        </View>
        <View style={daily.summaryBox}>
          <Text style={daily.summaryValue}>+{projectedXp}</Text>
          <Text style={daily.summaryLabel}>Pts hoy</Text>
        </View>
      </View>

      <View style={daily.progressTrack}>
        <View style={[daily.progressFill, { width: `${Math.min((completedCount / 6) * 100, 100)}%` }]} />
      </View>
      <Text style={daily.message}>{message}</Text>

      <View style={daily.rules}>
        <Text style={daily.ruleText}>3 tareas: día cumplido +20</Text>
        <Text style={daily.ruleText}>6 tareas: día perfecto +50</Text>
        <Text style={daily.ruleText}>Racha 7/30 días: +100 / +500</Text>
      </View>

      <View style={daily.taskList}>
        {visibleTasks.map((task, index) => (
          <ChallengeRow
            key={task.id}
            challenge={task}
            isDone={completions[buildCompletionKey(task.id, task.frequency)] ?? false}
            completionKey={buildCompletionKey(task.id, task.frequency)}
            isLast={index === visibleTasks.length - 1 && isSurpriseRevealed}
            onToggleDone={onToggleDone}
          />
        ))}
        {!isSurpriseRevealed ? (
          <Pressable style={daily.surpriseButton} onPress={() => setSurpriseRevealed(true)}>
            <Ionicons name="sparkles-outline" size={18} color="#0D0B14" />
            <Text style={daily.surpriseText}>Descubre tu tarea sorpresa de hoy</Text>
          </Pressable>
        ) : null}
      </View>

      {streakDays === 0 && (
        <Text style={daily.closing}>
          Ayer no completaste tu día, pero hoy puedes volver más fuerte.
        </Text>
      )}
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const insets = useSafeAreaInsets()
  const { data, isLoading: isProgressLoading, isError: isProgressError, error: progressError, refetch: refetchProgress } = useProgress()
  const { data: completionsData, refetch: refetchCompletions } = useChallengeCompletions()
  const [animTrigger, setAnimTrigger] = useState<{ type: AnimSequence, ts: number } | null>(null)
  const [allowInitialSkeleton, setAllowInitialSkeleton] = useState(true)
  const [isProfileModalVisible, setProfileModalVisible] = useState(false)

  // Auth state for Avatar
  const storeUser = useAuthStore((state) => state.user)
  const user = Config.DEMO_UI_MODE ? MOCK_DATA.profile : storeUser
  const userDisplayName = (user as any)?.displayName || (user as any)?.name || 'Usuario'
  const userInitial = userDisplayName.trim()?.[0]?.toUpperCase() ?? '?'

  // Auto-reset del trigger de animación para permitir disparos sucesivos
  useEffect(() => {
    if (animTrigger) {
      const timer = setTimeout(() => setAnimTrigger(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [animTrigger])

  useEffect(() => {
    const timer = setTimeout(() => setAllowInitialSkeleton(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const triggerCelebrate = () => {
    setAnimTrigger({ type: 'celebrate', ts: Date.now() })
  }
  
  const progressData = data ?? DEFAULT_PROGRESS_DATA
  const isLoading = isProgressLoading && !data && allowInitialSkeleton
  const hasQueryError = isProgressError
  const completions = completionsData ?? {}

  if (isLoading) {
    return (
      <Screen style={styles.screen}>
        <AppHeader 
          variant="screen" 
          title="Progreso" 
          rightAction={
            <Pressable onPress={() => setProfileModalVisible(true)} style={headerStyles.avatarButton}>
              <Text style={headerStyles.avatarText}>{userInitial}</Text>
            </Pressable>
          }
        />
        <View style={{ flex: 1, padding: 20, gap: 20 }}>
          <Skeleton height={100} />
          <Skeleton height={300} />
          <Skeleton height={150} />
        </View>
        <ProfileModal visible={isProfileModalVisible} onClose={() => setProfileModalVisible(false)} />
      </Screen>
    )
  }

  if (hasQueryError && !data) {
    const errorMessage = progressError instanceof Error
      ? progressError.message
      : 'No pudimos cargar tu progreso.'

    return (
      <Screen style={styles.screen}>
        <AppHeader 
          variant="screen" 
          title="Progreso" 
          rightAction={
            <Pressable onPress={() => setProfileModalVisible(true)} style={headerStyles.avatarButton}>
              <Text style={headerStyles.avatarText}>{userInitial}</Text>
            </Pressable>
          }
        />
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={34} color={Tokens.colors.error} />
          <Text style={styles.errorTitle}>No pudimos cargar tu progreso</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              refetchProgress()
              refetchCompletions()
            }}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
        <ProfileModal visible={isProfileModalVisible} onClose={() => setProfileModalVisible(false)} />
      </Screen>
    )
  }

  if (data === undefined && !isProgressLoading && !isProgressError) {
    return (
      <Screen style={styles.screen}>
        <AppHeader
          variant="screen"
          title="Progreso"
          rightAction={
            <Pressable onPress={() => setProfileModalVisible(true)} style={headerStyles.avatarButton}>
              <Text style={headerStyles.avatarText}>{userInitial}</Text>
            </Pressable>
          }
        />
        <View style={styles.errorState}>
          <Ionicons name="leaf-outline" size={34} color={Tokens.colors.primary} />
          <Text style={styles.errorTitle}>No encontramos tu progreso todavía</Text>
          <Text style={styles.errorMessage}>
            Intenta completar una actividad o actualizar la app.
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              refetchProgress()
              refetchCompletions()
            }}
          >
            <Text style={styles.retryText}>Actualizar</Text>
          </Pressable>
        </View>
        <ProfileModal visible={isProfileModalVisible} onClose={() => setProfileModalVisible(false)} />
      </Screen>
    )
  }

  // PRIORIDAD DE ESTADO:
  // 1. data.stageOverride (persistent QA override from DB) - SOLO PARA EL PERSONAJE
  // 2. real snapshot (calculated from real XP) - FUENTE DE VERDAD PARA TODO LO DEMÁS
  const effectiveStageOverride = progressData.stageOverride ?? null
  const effectiveGender = progressData.genderOverride ?? null
  
  // Siempre calculamos el snapshot real para la barra de progreso, números y encabezado
  const realSnapshot = buildProgressSnapshot(progressData.xp ?? 0, progressData.streakDays ?? 0)
  
  // El stage visual para el personaje se determina por el override o por el real
  const visualStage = resolveVisualStage(effectiveStageOverride, realSnapshot.stage)

  const isMaxStage = realSnapshot.stage.id === 5

  return (
    <Screen style={styles.screen}>
      <AppHeader 
        variant="screen" 
        title="Progreso" 
        rightAction={
          <Pressable onPress={() => setProfileModalVisible(true)} style={headerStyles.avatarButton}>
            <Text style={headerStyles.avatarText}>{userInitial}</Text>
          </Pressable>
        }
      />
      
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <ProgressHeader
          stageId={realSnapshot.stage.id}
          stageName={realSnapshot.stage.visibleName}
        />

        <DailyCommitmentPanel
          completions={completions}
          streakDays={realSnapshot.streakDays}
          onToggleDone={triggerCelebrate}
        />

        <CharacterPortrait 
          characterStage={visualStage.characterStage} 
          stageId={visualStage.id} 
          gender={effectiveGender || undefined}
          animationTrigger={animTrigger}
        />
        <ProgressStats 
          progressPct={realSnapshot.progressPctInStage} 
          currentXp={realSnapshot.xp} 
          nextLevelXp={realSnapshot.stage.xpMax ?? (realSnapshot.xp + 1)} 
        />

        <View style={styles.quoteSection}>
           <Text style={styles.phrase}>"{realSnapshot.stage.phrase}"</Text>
           <Text style={styles.verseRef}>Palabra de Vida</Text>
        </View>

        <View style={{ height: 40 }} />

        {!isMaxStage && realSnapshot.nextStage && (
          <NextMilestone 
            xpToNext={realSnapshot.xpToNextStage ?? 0} 
            nextVisibleName={realSnapshot.nextStage.visibleName} 
            nextPhrase={realSnapshot.nextStage.phrase} 
          />
        )}
        {isMaxStage && <MentorCard phrase={realSnapshot.stage.phrase} />}


        <View style={{ marginTop: SECTION_GAP }}>
          <ChallengeSection 
            title="Retos Semanales" 
            variant="weekly" 
            challenges={realSnapshot.activeWeeklyChallenges} 
            completions={completions}
            onToggleDone={triggerCelebrate}
          />
          <ChallengeSection 
            title="Retos Mensuales" 
            variant="monthly" 
            challenges={[realSnapshot.activeMonthlyChallenge]} 
            completions={completions}
            onToggleDone={triggerCelebrate}
          />
        </View>
      </ScrollView>

      <ProfileModal visible={isProfileModalVisible} onClose={() => setProfileModalVisible(false)} />
    </Screen>
  )
}

const headerStyles = StyleSheet.create({
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 223, 223, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 16,
    color: '#0fdfdf',
    lineHeight: 20,
  }
})

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Tokens.colors.background },
  content: { paddingTop: 12, gap: 20 },
  quoteSection: { paddingHorizontal: 20, alignItems: 'center', marginTop: 8 },
  phrase: { fontFamily: Tokens.typography.fontFamily.regular, fontSize: 18, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontStyle: 'italic', lineHeight: 28 },
  verseRef: { fontFamily: Tokens.typography.fontFamily.semiBold, fontSize: 14, color: CYAN, marginTop: 12, letterSpacing: 1.5 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  errorTitle: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 18, color: Tokens.colors.textPrimary, marginTop: 14, textAlign: 'center' },
  errorMessage: { fontFamily: Tokens.typography.fontFamily.regular, fontSize: 14, color: Tokens.colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryButton: { marginTop: 20, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: Tokens.colors.primary },
  retryText: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 13, color: Tokens.colors.background },
})

const daily = StyleSheet.create({
  card: { marginHorizontal: 20, backgroundColor: CARD_BG, borderRadius: CARD_RADIUS, padding: 18, borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.14)' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  eyebrow: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 10, color: CYAN, letterSpacing: 1.4 },
  title: { fontFamily: Tokens.typography.fontFamily.display, fontSize: 34, lineHeight: 34, color: '#FFF', textTransform: 'uppercase', marginTop: 4 },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(15, 223, 223, 0.1)' },
  streakText: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 11, color: CYAN },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryBox: { flex: 1, borderRadius: 16, padding: 10, backgroundColor: 'rgba(255,255,255,0.045)' },
  summaryValue: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 14, color: '#FFF' },
  summaryLabel: { marginTop: 3, fontFamily: Tokens.typography.fontFamily.medium, fontSize: 10, color: 'rgba(255,255,255,0.42)' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: CYAN },
  message: { marginTop: 10, fontFamily: Tokens.typography.fontFamily.regular, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.72)' },
  rules: { marginTop: 12, gap: 5 },
  ruleText: { fontFamily: Tokens.typography.fontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.43)' },
  taskList: { marginTop: 16, overflow: 'hidden', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.025)' },
  surpriseButton: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: CYAN, paddingHorizontal: 14 },
  surpriseText: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 12, color: '#0D0B14', letterSpacing: 0.4 },
  closing: { marginTop: 14, fontFamily: Tokens.typography.fontFamily.regular, fontSize: 12, lineHeight: 18, color: 'rgba(255,255,255,0.5)' },
})

const header = StyleSheet.create({
  container: { marginBottom: 24, paddingHorizontal: 20 },
  label: { fontFamily: Tokens.typography.fontFamily.semiBold, fontSize: 12, color: CYAN, letterSpacing: 2, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  stageNum: { fontFamily: Tokens.typography.fontFamily.display, fontSize: 84, color: '#FFF', lineHeight: 80, marginRight: 16, includeFontPadding: false },
  stageName: { fontFamily: Tokens.typography.fontFamily.display, fontSize: 32, color: 'rgba(255, 255, 255, 0.8)', paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 2 },
})

const spot = StyleSheet.create({
  container: { 
    width: width, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  characterAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterWrapper: {
    // El tamaño se define dinámicamente en el componente
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    opacity: 0.15,
  },
})

const stats = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 32 },
  topInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  xpLabel: { fontFamily: Tokens.typography.fontFamily.semiBold, fontSize: 10, color: CYAN, letterSpacing: 1.5 },
  badge: { backgroundColor: 'rgba(15, 223, 223, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.3)' },
  badgeText: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 10, color: '#FFF' },
  
  barOuter: { position: 'relative', height: 12, marginBottom: 14 },
  barContainer: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  barFill: { height: '100%', backgroundColor: CYAN, borderRadius: 6 },
  glow: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    borderRadius: 6, 
    shadowColor: CYAN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8,
    zIndex: -1,
  },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  xpNumbers: { flexDirection: 'row', alignItems: 'baseline' },
  xpCurrent: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 20, color: '#FFF' },
  xpTotal: { fontFamily: Tokens.typography.fontFamily.medium, fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' },
  levelStatus: { fontFamily: Tokens.typography.fontFamily.semiBold, fontSize: 10, color: 'rgba(255, 255, 255, 0.3)', letterSpacing: 1.2, textTransform: 'uppercase' },
})

const xpc = StyleSheet.create({
  card: { marginHorizontal: 20, backgroundColor: 'rgba(15, 223, 223, 0.04)', borderRadius: CARD_RADIUS, paddingHorizontal: 20, paddingVertical: 18, borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.14)' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  xpValue: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 24, color: '#FFF' },
  xpUnit: { fontFamily: Tokens.typography.fontFamily.medium, fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' },
  pctBadge: { backgroundColor: 'rgba(15, 223, 223, 0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pctText: { fontFamily: Tokens.typography.fontFamily.semiBold, fontSize: 12, color: CYAN, letterSpacing: 0.5 },
  track: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginBottom: 10 },
  fill: { height: '100%', backgroundColor: CYAN, borderRadius: 5 },
  hint: { fontFamily: Tokens.typography.fontFamily.regular, fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' },
  hintAccent: { color: CYAN, fontFamily: Tokens.typography.fontFamily.semiBold },
  hintSub: { fontFamily: Tokens.typography.fontFamily.regular, fontSize: 11, color: 'rgba(255, 255, 255, 0.38)', marginTop: 5 },
  pctBadgeNear: { backgroundColor: 'rgba(15, 223, 223, 0.20)', borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.38)' },
  pctTextNear: { color: '#FFFFFF', fontFamily: Tokens.typography.fontFamily.bold },
  trackNear: { borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.28)' },
  fillNear: { backgroundColor: '#2feaea' },
  hintFlash: { color: CYAN, fontFamily: Tokens.typography.fontFamily.medium },
  hintNear: { color: 'rgba(15, 223, 223, 0.78)' },
})

const milestone = StyleSheet.create({
  card: { marginHorizontal: 20, backgroundColor: CARD_BG, borderRadius: CARD_RADIUS, padding: 24, borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.16)' },
  label: { fontFamily: Tokens.typography.fontFamily.medium, fontSize: 10, color: CYAN, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  name: { fontFamily: Tokens.typography.fontFamily.display, fontSize: 32, color: '#FFF', textTransform: 'uppercase', lineHeight: 32 * 1.05 },
  xpPill: { backgroundColor: 'rgba(15, 223, 223, 0.10)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.20)' },
  xpPillText: { fontFamily: Tokens.typography.fontFamily.semiBold, fontSize: 12, color: CYAN, letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: 'rgba(229, 223, 253, 0.08)', marginBottom: 16 },
  phrase: { fontFamily: Tokens.typography.fontFamily.regular, fontSize: 16, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 16 * 1.6 },
})

const mc = StyleSheet.create({
  card: { marginHorizontal: 20, backgroundColor: 'rgba(15, 223, 223, 0.04)', borderRadius: CARD_RADIUS, padding: 24, borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.30)' },
  badgeRow: { flexDirection: 'row', marginBottom: 14 },
  badge: { backgroundColor: 'rgba(15, 223, 223, 0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.25)' },
  badgeText: { fontFamily: Tokens.typography.fontFamily.medium, fontSize: 10, color: CYAN, letterSpacing: 1.5 },
  title: { fontFamily: Tokens.typography.fontFamily.display, fontSize: 36, color: CYAN, textTransform: 'uppercase', lineHeight: 36 * 1.05, marginBottom: 4 },
  subtitle: { fontFamily: Tokens.typography.fontFamily.regular, fontSize: 16, color: 'rgba(255, 255, 255, 0.5)', marginBottom: 16 },
  divider: { height: 1, backgroundColor: 'rgba(15, 223, 223, 0.10)', marginBottom: 16 },
  phrase: { fontFamily: Tokens.typography.fontFamily.regular, fontSize: 16, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 16 * 1.6, marginBottom: 16 },
  closing: { fontFamily: Tokens.typography.fontFamily.regular, fontSize: 12, color: 'rgba(15, 223, 223, 0.55)', fontStyle: 'italic', textAlign: 'center' },
})

const cs = StyleSheet.create({
  container: { marginBottom: 32, paddingHorizontal: 20 },
  header: { marginBottom: 12 },
  title: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 18, color: '#FFF' },
  list: { backgroundColor: CARD_BG, borderRadius: CARD_RADIUS, paddingHorizontal: 16, paddingVertical: 8 },
})

const cr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(229, 223, 253, 0.06)' },
  rowPressed: { opacity: 0.6 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15, 223, 223, 0.08)', borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.18)', alignItems: 'center', justifyContent: 'center' },
  iconCircleDone: { backgroundColor: CYAN, borderColor: CYAN },
  textBlock: { flex: 1, gap: 2 },
  title: { fontFamily: Tokens.typography.fontFamily.semiBold, fontSize: 16, color: '#FFF' },
  titleDone: { color: 'rgba(255, 255, 255, 0.3)' },
  desc: { fontFamily: Tokens.typography.fontFamily.regular, fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' },
  right: { alignItems: 'flex-end', gap: 5 },
  xpBadge: { backgroundColor: 'rgba(15, 223, 223, 0.10)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(15, 223, 223, 0.20)' },
  xpBadgeDone: { backgroundColor: 'rgba(15, 223, 223, 0.04)', borderColor: 'rgba(15, 223, 223, 0.08)' },
  xpText: { fontFamily: Tokens.typography.fontFamily.semiBold, fontSize: 11, color: CYAN },
  xpTextDone: { opacity: 0.35 },
  statusDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(229, 223, 253, 0.18)', alignItems: 'center', justifyContent: 'center' },
  statusDotDone: { backgroundColor: CYAN, borderColor: CYAN },
  xpFlash: { fontFamily: Tokens.typography.fontFamily.bold, fontSize: 12, color: CYAN, letterSpacing: 0.5, minWidth: 52, textAlign: 'right' },
})
