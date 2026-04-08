import { where } from 'firebase/firestore'
import { queryDocuments } from '../../../services/firebase/firestore'
import type { ChurchService } from './types'

const COLLECTION = 'church-services'

export async function fetchChurchServices(): Promise<ChurchService[]> {
  return queryDocuments<ChurchService>(
    COLLECTION,
    where('active', '==', true),
  )
}
