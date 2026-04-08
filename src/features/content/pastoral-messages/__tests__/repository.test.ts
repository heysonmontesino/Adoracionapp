jest.mock('../../../../services/firebase/firestore')

import {
  fetchLatestMessage,
  fetchMessage,
  fetchMessages,
  fetchPinnedMessage,
} from '../repository'
import * as firestoreService from '../../../../services/firebase/firestore'

const message = {
  id: 'message-1',
  title: 'La voz del pastor',
  body: 'Mensaje base',
}

describe('pastoral messages repository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the messages collection', async () => {
    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([message] as never)

    const result = await fetchMessages()

    expect(firestoreService.queryDocuments).toHaveBeenCalledWith(
      'pastoral-messages',
      expect.anything(),
      expect.anything(),
    )
    expect(result).toEqual([message])
  })

  it('fetches a message by id', async () => {
    const { id: _ignored, ...storedMessage } = message
    jest.spyOn(firestoreService, 'getDocument').mockResolvedValue(storedMessage as never)

    const result = await fetchMessage('message-1')

    expect(firestoreService.getDocument).toHaveBeenCalledWith(
      'pastoral-messages/message-1',
    )
    expect(result).toEqual(message)
  })

  it('returns the pinned message or null', async () => {
    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([message] as never)
    expect(await fetchPinnedMessage()).toEqual(message)

    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([] as never)
    expect(await fetchPinnedMessage()).toBeNull()
  })

  it('returns the latest message or null', async () => {
    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([message] as never)
    expect(await fetchLatestMessage()).toEqual(message)

    jest.spyOn(firestoreService, 'queryDocuments').mockResolvedValue([] as never)
    expect(await fetchLatestMessage()).toBeNull()
  })
})
