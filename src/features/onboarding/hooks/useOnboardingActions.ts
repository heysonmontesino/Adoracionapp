import { useState } from 'react'
import { completeOnboarding } from '../repository'
import { CharacterGender } from '../../character/types'
import { useAuthStore } from '../../auth/store'
import { useCharacterStore } from '../../character/store'

export function useOnboardingActions() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const setGender = useCharacterStore((state) => state.setGender)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function applyCompletedOnboarding(gender: CharacterGender): void {
    if (!user) return

    setGender(gender)
    setUser({
      ...user,
      onboardingCompleted: true,
      character: { ...user.character, gender },
    })
  }

  async function completeOnboardingForCurrentUser(
    gender: CharacterGender,
  ): Promise<boolean> {
    if (!user) return false

    setIsSubmitting(true)

    try {
      await completeOnboarding(user.uid, gender)
      applyCompletedOnboarding(gender)
      return true
    } catch (error: unknown) {
      console.error('[completeOnboarding] FAILED — uid:', user.uid, 'gender:', gender, error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    completeOnboardingForCurrentUser,
    isSubmitting,
    user,
  }
}
