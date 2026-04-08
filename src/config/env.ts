function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env variable: ${key}`)
  return value
}

export const env = {
  firebase: {
    apiKey: required('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: required('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: required('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: required('EXPO_PUBLIC_FIREBASE_APP_ID'),
  },
  google: {
    webClientId: required('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  },
  youtube: {
    apiKey: process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '',
    channelId: process.env.EXPO_PUBLIC_YOUTUBE_CHANNEL_ID ?? '',
  },
} as const
