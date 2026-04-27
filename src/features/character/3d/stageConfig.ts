import type { SpiritualStage } from '../types'

/**
 * Maps each spiritual stage to its background asset and ambient config.
 * The background is a static image overlaid under the 3D GLView.
 *
 * null imageSource → fallback gradient rendered in code (no asset needed).
 * Add real PNGs to assets/backgrounds/stage/ and update require() paths here.
 *
 * IMPORTANT: require() paths must be static strings — Metro bundler resolves
 * them at build time and cannot handle dynamic require(variable).
 */

export interface StageBackground {
  /** Static require() for the background image. null = use gradient fallback. */
  imageSource: number | null
  /** Top gradient color (used when imageSource is null) */
  gradientTop: string
  /** Bottom gradient color (used when imageSource is null) */
  gradientBottom: string
  /** Ambient light color for the 3D scene, hex string */
  ambientColor: number
  /** Directional light intensity */
  lightIntensity: number
}

const STAGE_BACKGROUNDS: Record<SpiritualStage, StageBackground> = {
  baby: {
    // Will be: require('../../../../assets/backgrounds/stage/baby.png')
    // Null until the PNG is placed. Code renders warm gradient fallback.
    imageSource: null,
    gradientTop: '#1a0f2e',
    gradientBottom: '#3d2b1f',
    ambientColor: 0xfff4e0, // warm candlelight
    lightIntensity: 1.2,
  },
  child: {
    imageSource: null,
    gradientTop: '#0d1b2a',
    gradientBottom: '#2c4a6e',
    ambientColor: 0xe8f4fd, // open sky
    lightIntensity: 1.4,
  },
  young: {
    imageSource: null,
    gradientTop: '#0a0a1a',
    gradientBottom: '#1a2a4a',
    ambientColor: 0xdde8ff, // cool urban
    lightIntensity: 1.5,
  },
  adult: {
    imageSource: null,
    gradientTop: '#0d1a0d',
    gradientBottom: '#1a3a1a',
    ambientColor: 0xe8ffe8, // mission/green
    lightIntensity: 1.6,
  },
  master: {
    imageSource: null,
    gradientTop: '#1a1200',
    gradientBottom: '#4a3800',
    ambientColor: 0xfff8e0, // mature golden
    lightIntensity: 1.8,
  },
}

export function getStageBackground(stage: SpiritualStage): StageBackground {
  return STAGE_BACKGROUNDS[stage]
}

/**
 * Derive a SpiritualStage from a numeric level (1–5 matching ProgressSnapshot.level).
 * Pure function — no imports from progress domain to avoid circular deps.
 */
export function levelToStage(level: 1 | 2 | 3 | 4 | 5): SpiritualStage {
  const map: Record<number, SpiritualStage> = {
    1: 'baby',
    2: 'child',
    3: 'young',
    4: 'adult',
    5: 'master',
  }
  return map[level] ?? 'baby'
}

/**
 * Maps a CharacterAnimation to the GLB clip name.
 * If the clip doesn't exist in the GLB, the mixer will stay on the last clip.
 */
export const ANIMATION_CLIP_NAMES: Record<string, string> = {
  idle: 'idle',
  walk: 'walk',
  celebrate: 'celebrate',
  pray: 'pray',
  // unmapped animations fall back to idle in Character3DView
  loading: 'idle',
  level_up: 'celebrate',
  streak_milestone: 'celebrate',
  welcome: 'idle',
}

/**
 * Per-character GLB asset paths.
 * require() must be static strings — Metro resolves them at build time.
 *
 * ACTIVAR UN ASSET: descomenta el require() correspondiente y coloca el archivo
 * en assets/character/<stage>_<gender>/<filename>.glb
 *
 * ESTADO ACTUAL: todos null — pipeline en producción de animaciones.
 * La pantalla de Progreso muestra SilhouetteFallback hasta que lleguen los GLBs.
 */
export type CharacterAssetKey =
  | 'baby_boy'  | 'baby_girl'
  | 'child_boy' | 'child_girl'
  | 'teen_boy'  | 'teen_girl'
  | 'young_boy' | 'young_girl'
  | 'adult_boy' | 'adult_girl'

export const CHARACTER_ASSETS: Record<CharacterAssetKey, number | null> = {
  baby_boy:   require('../../../../assets/character/baby_boy/spirit_baby_boy.glb'),
  baby_girl:  require('../../../../assets/character/baby_girl/spirit_baby_girl.glb'),
  child_boy:  null, // require('../../../../assets/character/child_boy/spirit_child_boy.glb')
  child_girl: null, // require('../../../../assets/character/child_girl/spirit_child_girl.glb')
  teen_boy:   null, // require('../../../../assets/character/teen_boy/spirit_teen_boy.glb')
  teen_girl:  null, // require('../../../../assets/character/teen_girl/spirit_teen_girl.glb')
  young_boy:  null, // require('../../../../assets/character/young_boy/spirit_young_boy.glb')
  young_girl: null, // require('../../../../assets/character/young_girl/spirit_young_girl.glb')
  adult_boy:  null, // require('../../../../assets/character/adult_boy/spirit_adult_boy.glb')
  adult_girl: null, // require('../../../../assets/character/adult_girl/spirit_adult_girl.glb')
}

/**
 * Expo mobile cannot decode GLB-embedded image bufferViews through GLTFLoader's
 * browser Blob/ObjectURL path. The character GLBs are therefore converted by
 * scripts/externalize-character-glb-textures.mjs so their images reference
 * static PNG/JPG files, and this map gives the native texture loader a static
 * Metro require() for each file.
 */
export const CHARACTER_TEXTURE_ASSETS: Partial<Record<CharacterAssetKey, Record<string, number>>> = {
  baby_boy: {
    spirit_baby_boy_texture_0: require('../../../../assets/character/baby_boy/spirit_baby_boy_texture_0.png'),
    'spirit_baby_boy_texture_0.png': require('../../../../assets/character/baby_boy/spirit_baby_boy_texture_0.png'),
  },
  baby_girl: {
    spirit_baby_girl_texture_0: require('../../../../assets/character/baby_girl/spirit_baby_girl_texture_0.jpg'),
    'spirit_baby_girl_texture_0.jpg': require('../../../../assets/character/baby_girl/spirit_baby_girl_texture_0.jpg'),
  },
}
