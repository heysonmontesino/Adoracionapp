import { useCharacterStore } from '../store'

describe('characterStore', () => {
  beforeEach(() => {
    useCharacterStore.setState({
      gender: 'boy',
      currentAnimation: 'idle',
      mode: 'lottie',
    })
  })

  it('starts with default values', () => {
    const state = useCharacterStore.getState()
    expect(state.gender).toBe('boy')
    expect(state.currentAnimation).toBe('idle')
    expect(state.mode).toBe('lottie')
  })

  it('setGender updates gender', () => {
    useCharacterStore.getState().setGender('girl')
    expect(useCharacterStore.getState().gender).toBe('girl')
  })

  it('setAnimation updates currentAnimation', () => {
    useCharacterStore.getState().setAnimation('level_up')
    expect(useCharacterStore.getState().currentAnimation).toBe('level_up')
  })

  it('setMode updates mode', () => {
    useCharacterStore.getState().setMode('3d')
    expect(useCharacterStore.getState().mode).toBe('3d')
  })
})
