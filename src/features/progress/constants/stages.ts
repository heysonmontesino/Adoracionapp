import type { StageDefinition } from '../types'

// ─── Sistema oficial de etapas espirituales ───────────────────────────────────
// Umbrales XP aprobados:
//   Novato:      0 – 299
//   Aprendiz:    300 – 899
//   Servidor:    900 – 1999
//   Discípulo:   2000 – 4999
//   Líder:       5000+

export const STAGES: StageDefinition[] = [
  {
    id: 1,
    internalName: 'Bebé espiritual',
    visibleName: 'Novato',
    xpMin: 0,
    xpMax: 299,
    stageVisualKey: 'baby',
    characterStage: 'baby',
    weeklySlots: 1,
    weeklyXpPerChallenge: 30,
    phrase: 'Todo camino comienza con un primer paso.',
  },
  {
    id: 2,
    internalName: 'Niño espiritual',
    visibleName: 'Aprendiz',
    xpMin: 300,
    xpMax: 899,
    stageVisualKey: 'child',
    characterStage: 'child',
    weeklySlots: 1,
    weeklyXpPerChallenge: 30,
    phrase: 'La fe que crece necesita raíces profundas.',
  },
  {
    id: 3,
    internalName: 'Joven espiritual',
    visibleName: 'Servidor',
    xpMin: 900,
    xpMax: 1999,
    stageVisualKey: 'young',
    characterStage: 'young',
    weeklySlots: 1,
    weeklyXpPerChallenge: 30,
    phrase: 'Caminando con propósito hacia la madurez.',
  },
  {
    id: 4,
    internalName: 'Adulto espiritual',
    visibleName: 'Discípulo',
    xpMin: 2000,
    xpMax: 4999,
    stageVisualKey: 'adult',
    characterStage: 'adult',
    weeklySlots: 2,
    weeklyXpPerChallenge: 35,
    phrase: 'La madurez espiritual se ve en cómo sirves a otros.',
  },
  {
    id: 5,
    internalName: 'Maestro espiritual',
    visibleName: 'Líder',
    xpMin: 5000,
    xpMax: null,
    stageVisualKey: 'master',
    characterStage: 'master',
    weeklySlots: 2,
    weeklyXpPerChallenge: 35,
    phrase: 'El que enseña sigue aprendiendo cada día.',
  },
]

// Lookup rápido por nombre interno (para lookups desde mock data legado)
export const STAGE_BY_INTERNAL_NAME = Object.fromEntries(
  STAGES.map((s) => [s.internalName, s])
) as Record<string, StageDefinition>
