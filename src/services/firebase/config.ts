import { initializeApp, getApps, getApp } from 'firebase/app'
import { env } from '../../config/env'

const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
}

export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
