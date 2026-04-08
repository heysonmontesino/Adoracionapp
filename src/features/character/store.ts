import { create } from 'zustand'
import { CharacterGender, CharacterMode, CharacterAnimation } from './types'

interface CharacterState {
  gender: CharacterGender
  currentAnimation: CharacterAnimation
  mode: CharacterMode
  setGender: (gender: CharacterGender) => void
  setAnimation: (animation: CharacterAnimation) => void
  setMode: (mode: CharacterMode) => void
}

export const useCharacterStore = create<CharacterState>((set) => ({
  gender: 'boy',
  currentAnimation: 'idle',
  mode: 'lottie',
  setGender: (gender) => set({ gender }),
  setAnimation: (animation) => set({ currentAnimation: animation }),
  setMode: (mode) => set({ mode }),
}))
