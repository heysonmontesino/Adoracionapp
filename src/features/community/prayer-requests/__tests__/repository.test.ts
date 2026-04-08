jest.mock('../../../../services/firebase/firestore')

import {
  createPrayerRequest,
  fetchPrayerRequest,
  fetchPrayerRequests,
  hasUserPrayed,
  prayForRequest,
} from '../repository'
import * as firestoreService from '../../../../services/firebase/firestore'

const basePrayerRequest = {
  id: 'req-1',
  userId: 'user-1',
  displayName: 'Juan',
  anonymous: false,
  title: null,
  body: 'Por favor oren por mi familia',
  visibility: 'public' as const,
  prayerCount: 3,
  status: 'active' as const,
}

describe('prayer-requests repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(firestoreService.Timestamp.now as jest.Mock).mockReturnValue({
      seconds: 0,
      nanoseconds: 0,
    })
  })

  describe('fetchPrayerRequests', () => {
    it('queries the prayer-requests collection for members (visibility filter)', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([basePrayerRequest] as never)

      const result = await fetchPrayerRequests('member')

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'prayer-requests',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      )
      expect(result).toEqual([basePrayerRequest])
    })

    it('queries without visibility filter for leaders', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([basePrayerRequest] as never)

      await fetchPrayerRequests('leader')

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'prayer-requests',
        expect.anything(),
        expect.anything(),
        expect.anything(),
      )
    })

    it('queries without visibility filter for pastors', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([])

      await fetchPrayerRequests('pastor')

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'prayer-requests',
        expect.anything(),
        expect.anything(),
        expect.anything(),
      )
    })
  })

  it('fetches a single prayer request by id', async () => {
    const { id: _id, ...stored } = basePrayerRequest
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(stored as never)

    const result = await fetchPrayerRequest('req-1')

    expect(firestoreService.getDocument).toHaveBeenCalledWith('prayer-requests/req-1')
    expect(result).toEqual(basePrayerRequest)
  })

  it('returns null when prayer request does not exist', async () => {
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(null)

    const result = await fetchPrayerRequest('missing')

    expect(result).toBeNull()
  })

  it('creates a prayer request and returns the new id', async () => {
    jest.spyOn(firestoreService, 'addDocument').mockResolvedValue('new-req-id')

    const id = await createPrayerRequest('user-1', 'Juan', {
      body: 'Oración por mi familia',
      anonymous: false,
      visibility: 'public',
    })

    expect(firestoreService.addDocument).toHaveBeenCalledWith(
      'prayer-requests',
      expect.objectContaining({
        userId: 'user-1',
        displayName: 'Juan',
        anonymous: false,
        body: 'Oración por mi familia',
        visibility: 'public',
        prayerCount: 0,
        status: 'active',
        answeredAt: null,
      }),
    )
    expect(id).toBe('new-req-id')
  })

  it('sets displayName to null when anonymous', async () => {
    jest.spyOn(firestoreService, 'addDocument').mockResolvedValue('anon-req')

    await createPrayerRequest('user-2', 'María', {
      body: 'Petición anónima',
      anonymous: true,
      visibility: 'public',
    })

    expect(firestoreService.addDocument).toHaveBeenCalledWith(
      'prayer-requests',
      expect.objectContaining({ displayName: null, anonymous: true }),
    )
  })

  it('writes a prayer doc and updates prayerCount', async () => {
    jest.spyOn(firestoreService, 'setDocument').mockResolvedValue(undefined)
    jest.spyOn(firestoreService, 'updateDocument').mockResolvedValue(undefined)

    await prayForRequest('req-1', 'user-1')

    expect(firestoreService.setDocument).toHaveBeenCalledWith(
      'prayer-requests/req-1/prayers/user-1',
      expect.objectContaining({ prayedAt: expect.anything() }),
    )
    expect(firestoreService.updateDocument).toHaveBeenCalledWith(
      'prayer-requests/req-1',
      expect.objectContaining({ prayerCount: expect.anything() }),
    )
  })

  it('checks whether a user has already prayed', async () => {
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue({ prayedAt: {} } as never)
    expect(await hasUserPrayed('req-1', 'user-1')).toBe(true)

    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(null)
    expect(await hasUserPrayed('req-1', 'user-1')).toBe(false)
  })
})
