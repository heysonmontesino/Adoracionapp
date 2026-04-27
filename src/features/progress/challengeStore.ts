import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ChallengeFrequency } from './types/index'

// ─── Period key helpers ───────────────────────────────────────────────────────
// Cada frecuencia usa un periodo diferente para que los resets sean correctos.

function getDayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekKey(): string {
  const d = new Date()
  // ISO week: semana 1 = la semana que contiene el 4 de enero
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const dayOfWeek = (d.getDay() + 6) % 7 // 0=Lun, 6=Dom
  const weekStart = new Date(d.getTime() - dayOfWeek * 86_400_000)
  const jan4DayOfWeek = (jan4.getDay() + 6) % 7
  const jan4WeekStart = new Date(jan4.getTime() - jan4DayOfWeek * 86_400_000)
  const weekNum = Math.round((weekStart.getTime() - jan4WeekStart.getTime()) / (7 * 86_400_000)) + 1
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function getMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Key de completado ────────────────────────────────────────────────────────
// Formato: {frequency}_{periodoActual}_{challengeId}
// Ejemplo: "daily_2026-04-19_daily-pray"
// Las claves de periodos pasados quedan inactivas de forma natural.

export function buildCompletionKey(id: string, frequency: ChallengeFrequency): string {
  const period =
    frequency === 'daily'  ? getDayKey() :
    frequency === 'weekly' ? getWeekKey() :
                             getMonthKey()
  return `${frequency}_${period}_${id}`
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ChallengeProgressState {
  completions: Record<string, boolean>
  toggleChallenge: (id: string, frequency: ChallengeFrequency) => void
  _hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
}

export const useChallengeProgressStore = create<ChallengeProgressState>()(
  persist(
    (set) => ({
      completions: {},
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      toggleChallenge: (id, frequency) => {
        const key = buildCompletionKey(id, frequency)
        set((state) => ({
          completions: {
            ...state.completions,
            [key]: !state.completions[key],
          },
        }))
      },
    }),
    {
      name: 'challenge-progress-v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
