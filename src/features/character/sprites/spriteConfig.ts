import type { CharacterAnimation, CharacterGender, SpiritualStage } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────
// Orden jerárquico para fallbacks inteligentes (de mayor a menor madurez/tamaño)
export const SPIRITUAL_STAGE_ORDER: SpiritualStage[] = ['master', 'adult', 'young', 'child', 'baby']

export type SpriteAssetKey = `${SpiritualStage}_${CharacterGender}`

export interface SpriteSheetMeta {
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  frameCount: number
  fps: number
}

export interface SpriteEntry {
  source: number
  meta: SpriteSheetMeta
  visualScale?: number // Multiplicador para normalización visual por asset
}

// CoreAnimation = todas las animaciones que pueden existir en SPRITE_ASSETS.
// No todos los stages tienen todas; usa idle como fallback (ver getSpriteEntry).
type CoreAnimation = 'idle' | 'walk' | 'pray' | 'celebrate' | 'thinking' | 'greeting' | 'handonheart'

// Maps every public CharacterAnimation to the nearest CoreAnimation.
// thinking/greeting caen sobre sí mismos; si el stage no los tiene → fallback a idle.
const ANIMATION_FALLBACK: Record<CharacterAnimation, CoreAnimation> = {
  idle:             'idle',
  walk:             'walk',
  pray:             'pray',
  celebrate:        'celebrate',
  thinking:         'thinking',
  greeting:         'greeting',
  loading:          'idle',
  level_up:         'celebrate',
  streak_milestone: 'celebrate',
  welcome:          'idle',
  handOnHeart:      'handonheart',
}

// ─── Asset registry ───────────────────────────────────────────────────────────
// Inner Partial: un stage no necesita tener todas las CoreAnimations.
// Ausentes hacen fallback a idle dentro de getSpriteEntry.

const SPRITE_ASSETS: Partial<Record<SpriteAssetKey, Partial<Record<CoreAnimation, SpriteEntry>>>> = {

  // ── baby_male ─────────────────────────────────────────────────────────────────
  baby_male: {
    idle: {
      source: require('../../../../assets/character-sprites/baby_male/idle.png'),
      meta: { frameWidth: 274, frameHeight: 412, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    walk: {
      source: require('../../../../assets/character-sprites/baby_male/walk.png'),
      meta: { frameWidth: 286, frameHeight: 470, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    pray: {
      source: require('../../../../assets/character-sprites/baby_male/pray.png'),
      meta: { frameWidth: 200, frameHeight: 418, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    celebrate: {
      source: require('../../../../assets/character-sprites/baby_male/celebrate.png'),
      meta: { frameWidth: 446, frameHeight: 420, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    // thinking/greeting no existen para baby → getSpriteEntry hace fallback a idle
  },

  // ── baby_female ─────────────────────────────────────────────────────────────────
  baby_female: {
    idle: {
      source: require('../../../../assets/character-sprites/baby_female/idle.png'),
      meta: { frameWidth: 202, frameHeight: 410, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    walk: {
      source: require('../../../../assets/character-sprites/baby_female/walk.png'),
      meta: { frameWidth: 262, frameHeight: 442, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    pray: {
      source: require('../../../../assets/character-sprites/baby_female/pray.png'),
      meta: { frameWidth: 212, frameHeight: 412, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    celebrate: {
      source: require('../../../../assets/character-sprites/baby_female/celebrate.png'),
      meta: { frameWidth: 356, frameHeight: 394, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    // thinking/greeting no existen para baby → getSpriteEntry hace fallback a idle
  },

  // ── child_male — metadata auditada desde PNG real (6×6 = 36 frames cada uno) ──
  child_male: {
    idle: {
      source: require('../../../../assets/character-sprites/child_male/idle.png'),
      meta: { frameWidth: 184, frameHeight: 422, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    walk: {
      source: require('../../../../assets/character-sprites/child_male/walk.png'),
      meta: { frameWidth: 220, frameHeight: 474, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    pray: {
      source: require('../../../../assets/character-sprites/child_male/pray.png'),
      meta: { frameWidth: 148, frameHeight: 418, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    celebrate: {
      source: require('../../../../assets/character-sprites/child_male/celebrate.png'),
      meta: { frameWidth: 306, frameHeight: 430, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    thinking: {
      source: require('../../../../assets/character-sprites/child_male/thinking.png'),
      meta: { frameWidth: 174, frameHeight: 420, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    greeting: {
      source: require('../../../../assets/character-sprites/child_male/greeting.png'),
      meta: { frameWidth: 380, frameHeight: 404, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
  },

  // ── child_female — metadata auditada desde PNG real (6×6 = 36 frames cada uno) ─
  child_female: {
    idle: {
      source: require('../../../../assets/character-sprites/child_female/idle.png'),
      meta: { frameWidth: 216, frameHeight: 418, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    walk: {
      source: require('../../../../assets/character-sprites/child_female/walk.png'),
      meta: { frameWidth: 226, frameHeight: 442, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    pray: {
      source: require('../../../../assets/character-sprites/child_female/pray.png'),
      meta: { frameWidth: 172, frameHeight: 412, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    celebrate: {
      source: require('../../../../assets/character-sprites/child_female/celebrate.png'),
      meta: { frameWidth: 522, frameHeight: 448, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    thinking: {
      source: require('../../../../assets/character-sprites/child_female/thinking.png'),
      meta: { frameWidth: 194, frameHeight: 416, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    greeting: {
      source: require('../../../../assets/character-sprites/child_female/greeting.png'),
      meta: { frameWidth: 248, frameHeight: 396, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
  },

  // ── young_male ────────────────────────────────────────────────────────────────
  young_male: {
    idle: {
      source: require('../../../../assets/character-sprites/young_male/idle.png'),
      meta: { frameWidth: 148, frameHeight: 402, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    walk: {
      source: require('../../../../assets/character-sprites/young_male/walk.png'),
      meta: { frameWidth: 292, frameHeight: 432, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    pray: {
      source: require('../../../../assets/character-sprites/young_male/pray.png'),
      meta: { frameWidth: 144, frameHeight: 404, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    celebrate: {
      source: require('../../../../assets/character-sprites/young_male/celebrate.png'),
      meta: { frameWidth: 330, frameHeight: 464, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    thinking: {
      source: require('../../../../assets/character-sprites/young_male/thinking.png'),
      meta: { frameWidth: 148, frameHeight: 404, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    greeting: {
      source: require('../../../../assets/character-sprites/young_male/greeting.png'),
      meta: { frameWidth: 238, frameHeight: 404, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    handonheart: {
      source: require('../../../../assets/character-sprites/young_male/handonheart.png'),
      meta: { frameWidth: 160, frameHeight: 414, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
  },

  // ── young_female ───────────────────────────────────────────────────────────────
  young_female: {
    idle: {
      source: require('../../../../assets/character-sprites/young_female/idle.png'),
      meta: { frameWidth: 140, frameHeight: 406, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    walk: {
      source: require('../../../../assets/character-sprites/young_female/walk.png'),
      meta: { frameWidth: 174, frameHeight: 434, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    pray: {
      source: require('../../../../assets/character-sprites/young_female/pray.png'),
      meta: { frameWidth: 284, frameHeight: 480, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    celebrate: {
      source: require('../../../../assets/character-sprites/young_female/celebrate.png'),
      meta: { frameWidth: 312, frameHeight: 474, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    thinking: {
      source: require('../../../../assets/character-sprites/young_female/thinking.png'),
      meta: { frameWidth: 150, frameHeight: 406, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    greeting: {
      source: require('../../../../assets/character-sprites/young_female/greeting.png'),
      meta: { frameWidth: 292, frameHeight: 408, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    handonheart: {
      source: require('../../../../assets/character-sprites/young_female/handonheart.png'),
      meta: { frameWidth: 132, frameHeight: 406, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
  },

  // ── adult_male (Adult male) ────────────────────────────────────────────────────
  adult_male: {
    idle: {
      source: require('../../../../assets/character-sprites/adult_male/idle.png'),
      meta: { frameWidth: 182, frameHeight: 400, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    walk: {
      source: require('../../../../assets/character-sprites/adult_male/walk.png'),
      meta: { frameWidth: 250, frameHeight: 452, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    pray: {
      source: require('../../../../assets/character-sprites/adult_male/pray.png'),
      meta: { frameWidth: 168, frameHeight: 400, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    celebrate: {
      source: require('../../../../assets/character-sprites/adult_male/celebrate.png'),
      meta: { frameWidth: 392, frameHeight: 436, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    thinking: {
      source: require('../../../../assets/character-sprites/adult_male/thinking.png'),
      meta: { frameWidth: 168, frameHeight: 406, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    greeting: {
      source: require('../../../../assets/character-sprites/adult_male/greeting.png'),
      meta: { frameWidth: 366, frameHeight: 400, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    handonheart: {
      source: require('../../../../assets/character-sprites/adult_male/handonheart.png'),
      meta: { frameWidth: 188, frameHeight: 400, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
  },

  // ── adult_female (Adult female) ──────────────────────────────────────────────────
  adult_female: {
    idle: {
      source: require('../../../../assets/character-sprites/adult_female/idle.png'),
      meta: { frameWidth: 268, frameHeight: 388, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    walk: {
      source: require('../../../../assets/character-sprites/adult_female/walk.png'),
      meta: { frameWidth: 308, frameHeight: 444, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    pray: {
      source: require('../../../../assets/character-sprites/adult_female/pray.png'),
      meta: { frameWidth: 268, frameHeight: 386, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    celebrate: {
      source: require('../../../../assets/character-sprites/adult_female/celebrate.png'),
      meta: { frameWidth: 300, frameHeight: 454, columns: 6, rows: 6, frameCount: 36, fps: 14 },
    },
    thinking: {
      source: require('../../../../assets/character-sprites/adult_female/thinking.png'),
      meta: { frameWidth: 268, frameHeight: 386, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    greeting: {
      source: require('../../../../assets/character-sprites/adult_female/greeting.png'),
      meta: { frameWidth: 266, frameHeight: 386, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    handonheart: {
      source: require('../../../../assets/character-sprites/adult_female/handonheart.png'),
      meta: { frameWidth: 268, frameHeight: 388, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
  },

  // ── master_male (Senior male) ──────────────────────────────────────────────────
  master_male: {
    idle: {
      source: require('../../../../assets/character-sprites/master_male/idle.png'),
      meta: { frameWidth: 234, frameHeight: 390, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    pray: {
      source: require('../../../../assets/character-sprites/master_male/pray.png'),
      meta: { frameWidth: 234, frameHeight: 390, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    thinking: {
      source: require('../../../../assets/character-sprites/master_male/thinking.png'),
      meta: { frameWidth: 242, frameHeight: 398, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    greeting: {
      source: require('../../../../assets/character-sprites/master_male/greeting.png'),
      meta: { frameWidth: 278, frameHeight: 394, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
  },

  // ── master_female (Senior female) ────────────────────────────────────────────────
  master_female: {
    idle: {
      source: require('../../../../assets/character-sprites/master_female/idle.png'),
      meta: { frameWidth: 322, frameHeight: 380, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
    pray: {
      source: require('../../../../assets/character-sprites/master_female/pray.png'),
      meta: { frameWidth: 324, frameHeight: 382, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    thinking: {
      source: require('../../../../assets/character-sprites/master_female/thinking.png'),
      meta: { frameWidth: 316, frameHeight: 380, columns: 6, rows: 6, frameCount: 36, fps: 10 },
    },
    greeting: {
      source: require('../../../../assets/character-sprites/master_female/greeting.png'),
      meta: { frameWidth: 330, frameHeight: 382, columns: 6, rows: 6, frameCount: 36, fps: 12 },
    },
  },
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the SpriteEntry for a given stage + gender + animation.
 * BLINDAJE: 
 *   1. Busca el stage exacto. Si no existe, busca el inmediato inferior disponible (adult -> young -> child -> baby).
 *   2. Busca el sexo exacto. Si no existe para ese stage (raro), busca el otro.
 *   3. Busca la animación mapeada. Si no existe, usa 'idle'.
 */
export function getSpriteEntry(
  requestedStage: SpiritualStage,
  gender: CharacterGender,
  animation: CharacterAnimation,
): SpriteEntry | null {
  if (!requestedStage || !gender || !animation) return null

  // 1. Encontrar el mejor stage disponible (Fallback recursivo hacia abajo)
  const startIndex = SPIRITUAL_STAGE_ORDER.indexOf(requestedStage)
  if (startIndex === -1) return null // Stage inválido

  let resolvedStage: SpiritualStage | null = null
  let stageAssets: any = null

  for (let i = startIndex; i < SPIRITUAL_STAGE_ORDER.length; i++) {
    const current = SPIRITUAL_STAGE_ORDER[i]
    const key = `${current}_${gender}` as SpriteAssetKey
    if (SPRITE_ASSETS[key]) {
      resolvedStage = current
      stageAssets = SPRITE_ASSETS[key]
      break
    }
  }

  // Si no se encontró nada para ese sexo, intentar con el otro sexo en el mismo orden
  if (!stageAssets) {
    const fallbackGender: CharacterGender = gender === 'male' ? 'female' : 'male'
    for (let i = startIndex; i < SPIRITUAL_STAGE_ORDER.length; i++) {
      const current = SPIRITUAL_STAGE_ORDER[i]
      const key = `${current}_${fallbackGender}` as SpriteAssetKey
      if (SPRITE_ASSETS[key]) {
        resolvedStage = current
        stageAssets = SPRITE_ASSETS[key]
        break
      }
    }
  }

  if (!stageAssets) return null

  // 2. Resolver Animación
  const core = ANIMATION_FALLBACK[animation]
  const entry = stageAssets[core] ?? stageAssets.idle ?? null

  return entry
}
