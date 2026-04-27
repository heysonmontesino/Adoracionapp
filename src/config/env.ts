export const env = {
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  },
  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  },
  youtube: {
    apiKey: process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '',
    channelId: process.env.EXPO_PUBLIC_YOUTUBE_CHANNEL_ID ?? '',
  },
} as const

// Validation in development or at runtime if needed
if (!env.firebase.apiKey) {
  console.warn('Warning: EXPO_PUBLIC_FIREBASE_API_KEY is missing.')
}

