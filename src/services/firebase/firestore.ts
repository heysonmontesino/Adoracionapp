import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  QueryConstraint,
  DocumentData,
  Timestamp,
} from 'firebase/firestore'
import { firebaseApp } from './config'

export const db = getFirestore(firebaseApp)
export { Timestamp }

export async function getDocument<T>(path: string): Promise<T | null> {
  const ref = doc(db, path)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as T) : null
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
