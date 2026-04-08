import { useState } from 'react'
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Screen } from '../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../src/shared/components/feedback/EmptyState'
import { Button } from '../../../src/shared/components/ui/Button'
import { Colors } from '../../../src/shared/constants/colors'
import { CharacterPlaceholder } from '../../../src/features/character/CharacterPlaceholder'
import { useProgress } from '../../../src/features/progress/hooks/useProgress'
import { useHabits } from '../../../src/features/progress/hooks/useHabits'
import { useHabitCompletion } from '../../../src/features/progress/hooks/useHabitCompletion'
import { useCreateHabit } from '../../../src/features/progress/hooks/useCreateHabit'
import { getLevelConfig, getLevelProgress, getXPToNextLevel } from '../../../src/features/progress/engine/levels'
import { LEVELS } from '../../../src/config/constants'
import type { Habit } from '../../../src/features/progress/types'

// ─── XP Bar ──────────────────────────────────────────────────────────────────

function XPBar({ xp }: { xp: number }) {
  const config = getLevelConfig(xp)
  const progress = getLevelProgress(xp)
  const toNext = getXPToNextLevel(xp)
  const isMax = toNext === null

  return (
    <View>
      <View className="flex-row items-end justify-between mb-2">
        <View>
          <Text className="font-humane text-6xl text-on-surface uppercase leading-none">
            Nivel {config.level}
          </Text>
          <Text className="font-jakarta-regular text-sm text-primary mt-1">
            {config.name}
          </Text>
        </View>
        <Text className="font-jakarta-bold text-base text-on-surface/60 mb-1">
          {xp.toLocaleString()} XP
        </Text>
      </View>

      {/* Progress bar */}
      <View className="h-2 rounded-full bg-surface-bright overflow-hidden">
        <View
          className="h-2 rounded-full bg-primary"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>

      {isMax ? (
        <Text className="font-jakarta-regular text-xs text-on-surface/40 mt-2">
          Nivel máximo alcanzado
        </Text>
      ) : (
        <Text className="font-jakarta-regular text-xs text-on-surface/40 mt-2">
          {toNext?.toLocaleString()} XP para el siguiente nivel
        </Text>
      )}
    </View>
  )
}

// ─── Streak badge ─────────────────────────────────────────────────────────────

function StreakBadge({ streakDays, longestStreak }: { streakDays: number; longestStreak: number }) {
  return (
    <View className="flex-row gap-3">
      <View className="flex-1 rounded-2xl bg-surface-container-low px-4 py-4 items-center">
        <Text className="font-humane text-4xl text-primary leading-none">
          {streakDays}
        </Text>
        <Text className="font-jakarta-medium text-xs text-on-surface/60 uppercase tracking-[1px] mt-1">
          {streakDays === 1 ? 'Día' : 'Días'} seguidos
        </Text>
      </View>
      <View className="flex-1 rounded-2xl bg-surface-container-low px-4 py-4 items-center">
        <Text className="font-humane text-4xl text-on-surface/60 leading-none">
          {longestStreak}
        </Text>
        <Text className="font-jakarta-medium text-xs text-on-surface/40 uppercase tracking-[1px] mt-1">
          Mejor racha
        </Text>
      </View>
    </View>
  )
}

// ─── Level roadmap ────────────────────────────────────────────────────────────

function LevelRoadmap({ currentLevel }: { currentLevel: number }) {
  return (
    <View>
      <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-on-surface/60 mb-3">
        Camino espiritual
      </Text>
      <View className="gap-2">
        {LEVELS.map((lvl) => {
          const reached = lvl.level <= currentLevel
          const isCurrent = lvl.level === currentLevel
          return (
            <View
              key={lvl.level}
              className={`flex-row items-center gap-3 rounded-2xl px-4 py-3 ${
                isCurrent
                  ? 'bg-surface-container'
                  : 'bg-surface-container-low'
              }`}
            >
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  reached ? 'bg-primary' : 'bg-surface-bright'
                }`}
              >
                <Text
                  className={`font-jakarta-bold text-sm ${
                    reached ? 'text-background' : 'text-on-surface/30'
                  }`}
                >
                  {lvl.level}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className={`font-jakarta-medium text-sm ${
                    reached ? 'text-on-surface' : 'text-on-surface/40'
                  }`}
                >
                  {lvl.name}
                </Text>
                {lvl.maxXP !== Infinity ? (
                  <Text className="font-jakarta-regular text-xs text-on-surface/40">
                    {lvl.minXP.toLocaleString()} – {lvl.maxXP.toLocaleString()} XP
                  </Text>
                ) : (
                  <Text className="font-jakarta-regular text-xs text-on-surface/40">
                    {lvl.minXP.toLocaleString()}+ XP
                  </Text>
                )}
              </View>
              {isCurrent ? (
                <Text className="font-jakarta-bold text-xs text-primary uppercase tracking-[1px]">
                  Aquí
                </Text>
              ) : null}
            </View>
          )
        })}
      </View>
    </View>
  )
}

// ─── Habit row ────────────────────────────────────────────────────────────────

function HabitRow({
  habit,
  completedToday,
  onComplete,
  isCompleting,
}: {
  habit: Habit
  completedToday: boolean
  onComplete: () => void
  isCompleting: boolean
}) {
  return (
    <View
      className={`flex-row items-center gap-4 rounded-2xl px-4 py-4 ${
        completedToday ? 'bg-surface-container-low' : 'bg-surface-container'
      }`}
    >
      <TouchableOpacity
        onPress={onComplete}
        disabled={completedToday || isCompleting}
        activeOpacity={0.7}
        className={`w-7 h-7 rounded-full border-2 items-center justify-center ${
          completedToday ? 'border-primary bg-primary' : 'border-on-surface/30'
        }`}
      >
        {completedToday ? (
          <Text className="font-jakarta-bold text-xs text-background">✓</Text>
        ) : null}
      </TouchableOpacity>

      <View className="flex-1">
        <Text
          className={`font-jakarta-medium text-sm ${
            completedToday ? 'text-on-surface/40 line-through' : 'text-on-surface'
          }`}
        >
          {habit.name}
        </Text>
        <Text className="font-jakarta-regular text-xs text-on-surface/40 mt-0.5">
          +{habit.xpReward} XP
        </Text>
      </View>

      {isCompleting && !completedToday ? (
        <Text className="font-jakarta-regular text-xs text-primary">...</Text>
      ) : null}
    </View>
  )
}

// ─── Add habit modal ──────────────────────────────────────────────────────────

function AddHabitModal({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const { mutate: createHabit, isPending } = useCreateHabit()

  function handleCreate() {
    if (!name.trim()) return
    createHabit(
      { name: name.trim(), xpReward: 50 },
      {
        onSuccess: () => {
          setName('')
          onClose()
        },
        onError: () => Alert.alert('Error', 'No se pudo crear el hábito.'),
      },
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background px-6 pt-12 pb-8">
        <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
          NUEVO HÁBITO
        </Text>
        <Text className="font-jakarta-regular text-sm text-on-surface/60 mb-8">
          Define una práctica espiritual diaria. Completarla te otorgará 50 XP.
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ej: Lectura bíblica 10 minutos"
          placeholderTextColor={Colors.onSurface40}
          className="rounded-2xl bg-surface-container-low px-4 py-4 font-jakarta-regular text-base text-on-surface mb-6"
          autoFocus
          maxLength={60}
        />

        <Button
          label="Crear hábito"
          onPress={handleCreate}
          isLoading={isPending}
          disabled={!name.trim()}
        />
        <View className="mt-3">
          <Button label="Cancelar" variant="ghost" onPress={onClose} disabled={isPending} />
        </View>
      </View>
    </Modal>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const [showAddHabit, setShowAddHabit] = useState(false)

  const { data: progress, isLoading: progressLoading, isError: progressError, refetch: refetchProgress } = useProgress()
  const { habits, completedTodayIds, isLoading: habitsLoading, isError: habitsError, refetch: refetchAll } = useHabits()
  const { mutate: complete, isPending: isCompleting, variables: completingVars } = useHabitCompletion()

  const isLoading = progressLoading || habitsLoading

  if (isLoading) {
    return (
      <Screen>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 20 }}>
          <Skeleton height={120} borderRadius={24} />
          <Skeleton height={60} borderRadius={24} />
          <Skeleton height={80} borderRadius={24} />
          <Skeleton height={80} borderRadius={24} />
          <Skeleton height={200} borderRadius={24} />
        </ScrollView>
      </Screen>
    )
  }

  if ((progressError && !progress) || (habitsError && habits.length === 0)) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar tu progreso"
            message="Revisa tu conexión o intenta nuevamente."
            actionLabel="Reintentar"
            onAction={() => { refetchProgress(); refetchAll() }}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100, gap: 24 }}>

        {/* Character */}
        <View className="items-center py-4">
          <CharacterPlaceholder />
        </View>

        {/* XP + Level */}
        {progress ? (
          <View className="rounded-3xl bg-surface-container-low p-5">
            <XPBar xp={progress.xp} />
          </View>
        ) : null}

        {/* Streak */}
        {progress ? (
          <StreakBadge
            streakDays={progress.streakDays}
            longestStreak={progress.longestStreak}
          />
        ) : null}

        {/* Habits */}
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-on-surface/60">
              Hábitos de hoy
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddHabit(true)}
              activeOpacity={0.7}
              className="rounded-full bg-surface-bright px-3 py-1.5"
            >
              <Text className="font-jakarta-bold text-xs text-primary">+ Agregar</Text>
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
            <EmptyState
              title="Sin hábitos aún"
              message="Agrega tu primera práctica espiritual diaria y comienza a acumular XP."
              actionLabel="Agregar hábito"
              onAction={() => setShowAddHabit(true)}
            />
          ) : (
            <View className="gap-2">
              {habits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  completedToday={completedTodayIds.has(habit.id)}
                  isCompleting={isCompleting && completingVars?.habitId === habit.id}
                  onComplete={() => {
                    if (!progress) return
                    complete({ habitId: habit.id, currentProgress: progress })
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Level roadmap */}
        {progress ? (
          <View className="rounded-3xl bg-surface-container-low p-5">
            <LevelRoadmap currentLevel={progress.level} />
          </View>
        ) : null}

      </ScrollView>

      <AddHabitModal visible={showAddHabit} onClose={() => setShowAddHabit(false)} />
    </Screen>
  )
}
