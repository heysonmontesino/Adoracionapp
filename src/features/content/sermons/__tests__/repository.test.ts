jest.mock('../../../../services/firebase/firestore')

import {
  fetchFeaturedSermon,
  fetchSermon,
  fetchSermons,
} from '../repository'
import * as firestoreService from '../../../../services/firebase/firestore'

const sermon = {
  id: 'sermon-1',
  title: 'Fe en medio del valle',
  description: 'Predica pastoral',
}

describe('sermons repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the sermons collection', async () => {
    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([sermon] as never)

    const result = await fetchSermons()

    expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
      'sermons',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    )
    expect(result).toEqual([sermon])
  })

  it('fetches a sermon by id', async () => {
    const { id: _ignored, ...storedSermon } = sermon
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(storedSermon as never)

    const result = await fetchSermon('sermon-1')

    expect(firestoreService.getDocument).toHaveBeenCalledWith('sermons/sermon-1')
    expect(result).toEqual(sermon)
  })

  it('returns the first featured sermon or null', async () => {
    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([sermon] as never)
    expect(await fetchFeaturedSermon()).toEqual(sermon)

    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([] as never)
    expect(await fetchFeaturedSermon()).toBeNull()
  })
})
