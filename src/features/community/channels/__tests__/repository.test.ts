jest.mock('../../../../services/firebase/firestore')

import {
  createPost,
  fetchChannel,
  fetchChannelPosts,
  fetchChannels,
} from '../repository'
import * as firestoreService from '../../../../services/firebase/firestore'

const baseChannel = {
  id: 'ch-1',
  name: 'General',
  description: 'Canal público de la iglesia',
  type: 'public' as const,
}

const basePost = {
  id: 'post-1',
  userId: 'user-1',
  displayName: 'Juan',
  photoURL: null,
  title: null,
  body: '¡Bienvenidos hermanos!',
}

describe('channels repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(firestoreService.Timestamp.now as jest.Mock).mockReturnValue({
      seconds: 0,
      nanoseconds: 0,
    })
  })

  describe('fetchChannels', () => {
    it('fetches channels for members', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([baseChannel] as never)

      const result = await fetchChannels('member')

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'channels',
        expect.anything(),
        expect.anything(),
      )
      expect(result).toEqual([baseChannel])
    })

    it('fetches channels for leaders', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([baseChannel] as never)

      await fetchChannels('leader')

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'channels',
        expect.anything(),
        expect.anything(),
      )
    })

    it('fetches all channel types for pastors', async () => {
      jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([baseChannel] as never)

      await fetchChannels('pastor')

      expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
        'channels',
        expect.anything(),
        expect.anything(),
      )
    })
  })

  it('fetches a single channel by id', async () => {
    const { id: _id, ...stored } = baseChannel
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(stored as never)

    const result = await fetchChannel('ch-1')

    expect(firestoreService.getDocument).toHaveBeenCalledWith('channels/ch-1')
    expect(result).toEqual(baseChannel)
  })

  it('returns null when channel does not exist', async () => {
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(null)

    expect(await fetchChannel('missing')).toBeNull()
  })

  it('fetches posts for a channel', async () => {
    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([basePost] as never)

    const result = await fetchChannelPosts('ch-1')

    expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
      'channels/ch-1/posts',
      expect.anything(),
      expect.anything(),
    )
    expect(result).toEqual([basePost])
  })

  it('creates a post and returns the new id', async () => {
    jest.spyOn(firestoreService, 'addDocument').mockResolvedValue('new-post-id')

    const id = await createPost('ch-1', 'user-1', 'Juan', null, {
      body: 'Nuevo mensaje',
    })

    expect(firestoreService.addDocument).toHaveBeenCalledWith(
      'channels/ch-1/posts',
      expect.objectContaining({
        userId: 'user-1',
        displayName: 'Juan',
        photoURL: null,
        body: 'Nuevo mensaje',
        title: null,
      }),
    )
    expect(id).toBe('new-post-id')
  })
})
