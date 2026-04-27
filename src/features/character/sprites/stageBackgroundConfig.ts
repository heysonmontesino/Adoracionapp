import type { SpiritualStage } from '../types'

/**
 * Stage background config for the 2D sprite preview and character screens.
 *
 * imageSource: static require() for a background image, or null → gradiente.
 * gradientTop / gradientBottom: always present as fallback (and for ambient tinting).
 *
 * ACTIVAR IMAGEN:
 *   1. Coloca el PNG en assets/character-backgrounds/<stage>.png
 *   2. Descomenta el require() correspondiente.
 *   3. La preview screen renderizará la imagen como capa inferior.
 *
 * Estructura esperada:
 *   assets/character-backgrounds/baby.png
 *   assets/character-backgrounds/child.png
 *   assets/character-backgrounds/teen.png
 *   assets/character-backgrounds/young.png
 *   assets/character-backgrounds/adult.png
 */

export interface SpriteStageBackground {
  /** Static require() for a full-bleed background image. null = gradient fallback only. */
  imageSource: number | null
  /** Top color for gradient fallback (also used as ambient tint). */
  gradientTop: string
  /** Bottom color for gradient fallback. */
  gradientBottom: string
}

export const STAGE_BACKGROUNDS: Record<SpiritualStage, SpriteStageBackground> = {
  baby: {
    imageSource:    null,
    gradientTop:    '#1a0f2e',
    gradientBottom: '#3d2b1f',
  },
  child: {
    imageSource:    null,
    gradientTop:    '#0d1b2a',
    gradientBottom: '#2c4a6e',
  },
  young: {
    imageSource:    null,
    gradientTop:    '#0d1a0d',
    gradientBottom: '#1a3a1a',
  },
  adult: {
    imageSource:    null,
    gradientTop:    '#1a1200',
    gradientBottom: '#4a3800',
  },
  master: {
    imageSource:    null,
    gradientTop:    '#1a0f2e',
    gradientBottom: '#0f1a2e',
  },
}

export function getSpriteStageBackground(stage: SpiritualStage): SpriteStageBackground {
  return STAGE_BACKGROUNDS[stage]
}
