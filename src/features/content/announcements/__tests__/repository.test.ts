jest.mock('../../../../services/firebase/firestore')

import {
  fetchAnnouncements,
  fetchPinnedAnnouncement,
} from '../repository'
import * as firestoreService from '../../../../services/firebase/firestore'

const announcement = {
  id: 'announcement-1',
  title: 'Noche de oración',
}

describe('announcements repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the announcements collection', async () => {
    jest
      .spyOn(firestoreService, 'queryDocuments')
      .mockResolvedValue([announcement] as never)

    const result = await fetchAnnouncements()

    expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
      'announcements',
      expect.anything(),
      expect.anything(),
    )
    expect(result).toEqual([announcement])
  })

  it('returns the pinned announcement or null', async () => {
    jest
      .spyOn(firestoreService, 'queryDocuments')
      .mockResolvedValue([announcement] as never)
    expect(await fetchPinnedAnnouncement()).toEqual(announcement)

    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([] as never)
    expect(await fetchPinnedAnnouncement()).toBeNull()
  })
})
