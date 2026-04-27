import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  runTransaction,
  QueryConstraint,
  DocumentData,
  Timestamp,
} from 'firebase/firestore'
import { firebaseApp } from './config'

export const db = getFirestore(firebaseApp)
export { Timestamp }

// ─── Transaction support ──────────────────────────────────────────────────────

export interface TransactionContext {
  get<T>(path: string): Promise<T | null>
  set<T extends DocumentData>(path: string, data: T): void
  update(path: string, data: Partial<DocumentData>): void
  delete(path: string): void
}

/**
 * Wraps Firestore runTransaction with typed path-based helpers.
 * All three writes inside the callback commit atomically or not at all.
 */
export async function executeTransaction<T>(
  callback: (tx: TransactionContext) => Promise<T>,
): Promise<T> {
  return runTransaction(db, async (transaction) => {
    const ctx: TransactionContext = {
      get: async <T>(path: string): Promise<T | null> => {
        const ref = doc(db, path)
        const snap = await transaction.get(ref)
        return snap.exists() ? (snap.data() as T) : null
      },
      set: <T extends DocumentData>(path: string, data: T): void => {
        transaction.set(doc(db, path), data)
      },
      update: (path: string, data: Partial<DocumentData>): void => {
        transaction.update(doc(db, path), data)
      },
      delete: (path: string): void => {
        transaction.delete(doc(db, path))
      },
    }
    return callback(ctx)
  })
}

/**
 * Generates a Firestore document ID without writing.
 * Use before a transaction to pre-compute the ID for append-only collections.
 */
export function generateDocId(collectionPath: string): string {
  return doc(collection(db, collectionPath)).id
}

export async function getDocument<T>(path: string): Promise<T | null> {
  const ref = doc(db, path)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as T) : null
}

export async function addDocument<T extends DocumentData>(
  collectionPath: string,
  data: T,
): Promise<string> {
  const ref = collection(db, collectionPath)
  const docRef = await addDoc(ref, data)
  return docRef.id
}

export async function setDocument<T extends DocumentData>(
  path: string,
  data: T,
): Promise<void> {
  const ref = doc(db, path)
  await setDoc(ref, data)
}

export async function updateDocument(
  path: string,
  data: Partial<DocumentData>,
): Promise<void> {
  const ref = doc(db, path)
  await updateDoc(ref, data)
}

export async function queryDocuments<T>(
  collectionPath: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const ref = collection(db, collectionPath)
  const q = query(ref, ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))
}
