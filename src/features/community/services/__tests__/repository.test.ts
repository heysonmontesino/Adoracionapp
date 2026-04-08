jest.mock('../../../../services/firebase/firestore')

import { fetchChurchServices } from '../repository'
import * as firestoreService from '../../../../services/firebase/firestore'

const baseService = {
  id: 'svc-1',
  name: 'Culto Dominical',
  schedule: 'Domingos 10:00am',
  dayOfWeek: 0,
  startTime: '10:00',
  location: 'Templo Principal',
  address: null,
  mapsURL: null,
  active: true,
}

describe('church-services repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches only active church services', async () => {
    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([baseService] as never)

    const result = await fetchChurchServices()

    expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
      'church-services',
      expect.anything(),
    )
    expect(result).toEqual([baseService])
  })

  it('returns an empty array when there are no active services', async () => {
    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([])

    const result = await fetchChurchServices()

    expect(result).toEqual([])
  })
})
