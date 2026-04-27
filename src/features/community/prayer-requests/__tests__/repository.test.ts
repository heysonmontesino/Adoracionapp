jest.mock('../../../../services/firebase/firestore')
jest.mock('../../../../shared/constants/config', () => ({
  Config: {
    DEMO_UI_MODE: false,
  },
}))

import {
  __resetPrayerRequestsDemoState,
  createPrayerRequest,
  fetchPrayerRequests,
  hasUserPrayed,
  prayForRequest,
} from '../repository'
import * as firestoreService from '../../../../services/firebase/firestore'
import { Config } from '../../../../shared/constants/config'

describe('prayer-requests repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetPrayerRequestsDemoState()
    ;(Config as { DEMO_UI_MODE: boolean }).DEMO_UI_MODE = false
    ;(firestoreService.Timestamp.now as jest.Mock).mockReturnValue({
      seconds: 0,
      nanoseconds: 0,
    })
  })

  it('queries Firestore for live prayer requests', async () => {
    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([] as never)

    await fetchPrayerRequests('member', 'community')

    expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
      'prayer-requests',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    )
  })

  it('creates a Firestore prayer request in live mode', async () => {
    jest.spyOn(firestoreService, 'addDocument').mockResolvedValue('new-req-id')

    const id = await createPrayerRequest('user-1', 'Juan', {
      body: 'Oracion por mi familia esta semana',
      title: 'Por mi familia',
      anonymous: false,
      category: 'familia',
      type: 'community',
    })

    expect(firestoreService.addDocument).toHaveBeenCalledWith(
      'prayer-requests',
      expect.objectContaining({
        userId: 'user-1',
        author: { displayName: 'Juan', isAnonymous: false },
        body: 'Oracion por mi familia esta semana',
        title: 'Por mi familia',
        category: 'familia',
        type: 'community',
        prayerCount: 0,
        status: 'active',
        answeredAt: null,
      }),
    )
    expect(id).toBe('new-req-id')
  })

  it('stores demo prayer requests in memory when demo mode is enabled', async () => {
    ;(Config as { DEMO_UI_MODE: boolean }).DEMO_UI_MODE = true

    const id = await createPrayerRequest('demo-user', 'Usuario Demo', {
      body: 'Estoy pidiendo oracion por direccion y sabiduria',
      title: 'Direccion',
      anonymous: true,
      category: 'general',
      type: 'community',
    })

    const requests = await fetchPrayerRequests('member', 'community')

    expect(firestoreService.addDocument).not.toHaveBeenCalled()
    expect(id).toContain('demo-prayer-')
    expect(requests[0]).toEqual(
      expect.objectContaining({
        id,
        userId: 'demo-user',
        author: { displayName: null, isAnonymous: true },
        body: 'Estoy pidiendo oracion por direccion y sabiduria',
        title: 'Direccion',
      }),
    )
  })

  it('writes a prayer doc and updates prayerCount', async () => {
    const mockTx = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      update: jest.fn(),
    }
    ;(firestoreService.executeTransaction as jest.Mock).mockImplementation((cb) => cb(mockTx))

    await prayForRequest('req-1', 'user-1')

    expect(mockTx.set).toHaveBeenCalledWith(
      'prayer-requests/req-1/prayers/user-1',
      expect.objectContaining({ prayedAt: expect.anything() }),
    )
    expect(mockTx.update).toHaveBeenCalledWith(
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
