import { updateDocument } from '../../services/firebase/firestore'
import { CharacterGender } from '../character/types'

export async function completeOnboarding(
  uid: string,
  gender: CharacterGender,
): Promise<void> {
  await updateDocument(`users/${uid}`, {
    onboardingCompleted: true,
    'character.gender': gender,
  })
}
