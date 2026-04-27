import { getDocument } from '../../services/firebase/firestore'
import type { HomePastorMessage } from './types'

const HOME_PASTOR_MESSAGE_PATH = 'home_content/pastor_message'

function hasVisibleContent(message: HomePastorMessage): boolean {
  return message.isActive && message.title.trim().length > 0 && message.excerpt.trim().length > 0
}

export async function fetchActiveHomePastorMessage(): Promise<HomePastorMessage | null> {
  const message = await getDocument<Omit<HomePastorMessage, 'id'>>(HOME_PASTOR_MESSAGE_PATH)

  if (!message) return null

  const withId: HomePastorMessage = {
    ...message,
    id: 'pastor_message',
  }

  return hasVisibleContent(withId) ? withId : null
}
