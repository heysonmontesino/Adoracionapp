import { increment, limit, orderBy, where } from 'firebase/firestore'
import {
  addDocument,
  executeTransaction,
  getDocument,
  queryDocuments,
  setDocument,
  updateDocument,
  Timestamp,
} from '../../../services/firebase/firestore'
import { PAGINATION } from '../../../config/constants'
import { Config } from '../../../shared/constants/config'
import {
  fetchProgressSnapshot,
  _internalIncrementUserXP,
} from '../../progress/repository'
import { getXPReward } from '../../progress/engine/xp'
import type { UserRole } from '../../auth/types'
import type {
  CreatePrayerRequestInput,
  PrayerRequest,
  UpdatePrayerRequestInput,
} from './types'

const COLLECTION = 'prayer-requests'
let demoPrayerRequests: PrayerRequest[] = []

// ─── Mocks para Desarrollo ────────────────────────────────────────────────────
const MOCK_PRAYERS: PrayerRequest[] = [
  {
    id: 'mock-1',
    userId: 'system',
    author: { displayName: 'María L.', isAnonymous: false },
    title: 'Salud de mi madre',
    body: 'Pido oración por la salud de mi madre Petronila, quien está atravesando una recuperación difícil.',
    type: 'community',
    category: 'salud',
    prayerCount: 24,
    status: 'active',
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any,
    answeredAt: null,
  },
  {
    id: 'mock-2',
    userId: 'system',
    author: { displayName: null, isAnonymous: true },
    title: 'Fortaleza espiritual',
    body: 'Pido fortaleza para mi familia en este tiempo de transición.',
    type: 'community',
    category: 'general',
    prayerCount: 12,
    status: 'active',
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any,
    answeredAt: null,
  }
]

export async function fetchPrayerRequests(
  role: UserRole,
  type: 'community' | 'pastoral' = 'community'
): Promise<PrayerRequest[]> {
  if (Config.DEMO_UI_MODE) {
    return [
      ...demoPrayerRequests.filter((request) => request.type === type),
      ...MOCK_PRAYERS.filter((request) => request.type === type),
    ]
  }

  const isLeaderOrAbove = role === 'leader' || role === 'pastor' || role === 'admin'

  try {
    const constraints = [
      where('status', '==', 'active'),
      where('type', '==', type),
      orderBy('createdAt', 'desc'),
      limit(PAGINATION.prayerRequests)
    ]

    // Solo pastores/líderes o el propio autor deberían ver las pastorales.
    // El filtro por autor es más complejo en Query normal, así que en este endpoint
    // devolvemos las pastorales solo si es líder. El autor verá la suya en 'Mis Peticiones' (futuro).
    if (type === 'pastoral' && !isLeaderOrAbove) {
      console.log('[PrayerRequests] Denied access to pastoral feed for non-leader')
      return []
    }

    const results = await queryDocuments<PrayerRequest>(COLLECTION, ...constraints)
    return results
  } catch (error: any) {
    console.error('[PrayerRequests] Error fetching from Firestore:', error)
    throw error
  }
}

export async function createPrayerRequest(
  userId: string,
  displayName: string | null,
  input: CreatePrayerRequestInput,
): Promise<string> {
  console.log('[PrayerCreate/Repo] createPrayerRequest called', {
    userId,
    type: input.type,
    category: input.category,
    bodyLength: input.body.length,
    anonymous: input.anonymous,
  })

  const now = Timestamp.now()
  const data = {
    userId,
    author: {
      displayName: input.anonymous ? null : displayName,
      isAnonymous: input.anonymous,
    },
    title: input.title ?? null,
    body: input.body,
    type: input.type,
    category: input.category,
    prayerCount: 0,
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
    answeredAt: null,
  }

  console.log('[PrayerCreate/Repo] payload to Firestore:', JSON.stringify({
    userId: data.userId,
    type: data.type,
    category: data.category,
    bodyLength: data.body.length,
    anonymous: data.author.isAnonymous,
    status: data.status,
    prayerCount: data.prayerCount,
  }))

  if (Config.DEMO_UI_MODE) {
    const id = `demo-prayer-${Date.now()}`
    demoPrayerRequests = [
      {
        id,
        ...data,
      },
      ...demoPrayerRequests,
    ]
    console.log('[PrayerCreate/Repo] demo write success — id:', id)
    return id
  }

  try {
    const id = await addDocument(COLLECTION, data)
    console.log('[PrayerCreate/Repo] firestore write success — id:', id)
    return id
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const code = (err as any)?.code ?? 'unknown'
    console.error('[PrayerCreate/Repo] firestore write error:', msg, '| code:', code)
    throw err
  }
}

export async function markAsAnswered(requestId: string): Promise<void> {
  const now = Timestamp.now()
  await updateDocument(`${COLLECTION}/${requestId}`, {
    status: 'answered',
    answeredAt: now,
    updatedAt: now,
  })
}

export async function archivePrayerRequest(requestId: string): Promise<void> {
  const now = Timestamp.now()
  await updateDocument(`${COLLECTION}/${requestId}`, {
    status: 'archived',
    updatedAt: now,
  })
}

export async function prayForRequest(
  requestId: string,
  userId: string,
): Promise<void> {
  const prayerPath = `${COLLECTION}/${requestId}/prayers/${userId}`
  const requestPath = `${COLLECTION}/${requestId}`

  try {
    await executeTransaction(async (tx) => {
      // 1. Idempotencia: Verificar si el usuario ya oró por esta petición
      const existing = await tx.get(prayerPath)
      if (existing) {
        console.log('[PrayerRequests] User already prayed for this request:', requestId)
        return
      }

      // 2. Registrar la oración del usuario
      tx.set(prayerPath, {
        prayedAt: Timestamp.now(),
      })

      // 3. Incremento atómico del contador en la petición principal
      tx.update(requestPath, {
        prayerCount: increment(1),
        updatedAt: Timestamp.now(),
      })

      // 4. Otorgar XP al usuario (25 XP por defecto)
      const xpReward = getXPReward('prayer_offered')
      await _internalIncrementUserXP(
        tx,
        userId,
        xpReward,
        'prayer_offered',
        requestId, // Usamos requestId como sourceId para asegurar un solo XP por petición
        `prayer_${requestId}_${userId}` // Idempotencia absoluta
      )
    })
  } catch (error) {
    console.error('[PrayerRequests] Error recording prayer transaction:', error)
    throw error
  }
}

export async function hasUserPrayed(
  requestId: string,
  userId: string,
): Promise<boolean> {
  const doc = await getDocument(`${COLLECTION}/${requestId}/prayers/${userId}`)
  return doc !== null
}

export async function getPrayerRequest(requestId: string): Promise<PrayerRequest | null> {
  if (Config.DEMO_UI_MODE) {
    return (
      demoPrayerRequests.find((r) => r.id === requestId) ??
      MOCK_PRAYERS.find((r) => r.id === requestId) ??
      null
    )
  }
  return getDocument<PrayerRequest>(`${COLLECTION}/${requestId}`)
}

// NOTE: Requires a Firestore rules update to work — see firestore.rules Case 4 proposal.
// Current rules (Case 2) only allow authors to change status, not title/body/category/author.
export async function updatePrayerRequestContent(
  requestId: string,
  displayName: string | null,
  input: UpdatePrayerRequestInput,
): Promise<void> {
  if (Config.DEMO_UI_MODE) {
    demoPrayerRequests = demoPrayerRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            title: input.title ?? null,
            body: input.body,
            category: input.category,
            author: {
              displayName: input.anonymous ? null : displayName,
              isAnonymous: input.anonymous,
            },
            updatedAt: Timestamp.now() as any,
          }
        : r,
    )
    return
  }
  const now = Timestamp.now()
  await updateDocument(`${COLLECTION}/${requestId}`, {
    title: input.title ?? null,
    body: input.body,
    category: input.category,
    author: {
      displayName: input.anonymous ? null : displayName,
      isAnonymous: input.anonymous,
    },
    updatedAt: now,
  })
}

export function __resetPrayerRequestsDemoState(): void {
  demoPrayerRequests = []
}
