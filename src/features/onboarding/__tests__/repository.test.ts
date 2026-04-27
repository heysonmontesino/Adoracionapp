jest.mock('../../../services/firebase/firestore')

import { completeOnboarding } from '../repository'
import * as firestoreService from '../../../services/firebase/firestore'

describe('completeOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('updates the user document with onboarding completion and gender', async () => {
    jest.spyOn(firestoreService, 'updateDocument').mockResolvedValue(undefined)

    await completeOnboarding('user-1', 'female')

    expect(firestoreService.updateDocument).toHaveBeenCalledWith('users/user-1', {
      onboardingCompleted: true,
      'character.gender': 'female',
    })
  })
})
