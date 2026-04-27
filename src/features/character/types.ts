export type CharacterGender = 'male' | 'female'
export type CharacterMode = 'lottie' | '3d'
export type CharacterAnimation =
  | 'idle'
  | 'walk'
  | 'pray'
  | 'thinking'
  | 'greeting'
  | 'loading'
  | 'level_up'
  | 'celebrate'
  | 'streak_milestone'
  | 'welcome'
  | 'handOnHeart'

/**
 * Spiritual stage — drives background selection and future unlock gates.
 * Derived from ProgressSnapshot.level at the call site; never stored in this store.
 */
export type SpiritualStage = 'baby' | 'child' | 'young' | 'adult' | 'master'
