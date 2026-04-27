import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
}

const firebaseConfig = {
  apiKey: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

console.log('--- Firebase Smoke Test ---');
console.log('Project ID:', firebaseConfig.projectId);
console.log('App ID:', firebaseConfig.appId);

async function runTests() {
  let app;
  try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase App Initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase App:', error.code, error.message);
    process.exit(1);
  }

  const auth = getAuth(app);
  console.log('--- Auth Smoke Test ---');
  try {
    // We try a dummy sign in to check if Auth is reachable
    await signInWithEmailAndPassword(auth, 'smoke-test-verify@example.com', 'some-password-123');
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      console.log(`✅ Auth service is reachable (Error: ${error.code})`);
      console.log('   Testing if Email/Password registration is possible...');
      try {
        const { createUserWithEmailAndPassword, deleteUser } = await import('firebase/auth');
        // This will fail if the provider is disabled with 'auth/operation-not-allowed'
        // or succeed if enabled.
        const userCred = await createUserWithEmailAndPassword(auth, `test-${Date.now()}@example.com`, 'TemporaryPass123!');
        console.log('✅ Email/Password registration is USABLE');
        
        console.log('--- Firestore Smoke Test (Authenticated) ---');
        const db = getFirestore(app);
        try {
          // Attempt to write to a user-owned document or common collection
          // Based on rules, users might only write to /users/{uid}
          const userDoc = doc(db, 'users', userCred.user.uid);
          // Just a read attempt first
          await getDoc(userDoc);
          console.log('✅ Firestore service is reachable and readable for users');
        } catch (fsError) {
          console.error('❌ Firestore service test failed even while authenticated:', fsError.code, fsError.message);
        }

        await deleteUser(userCred.user);
        console.log('   (Test user cleaned up)');
      } catch (regError) {
        if (regError.code === 'auth/operation-not-allowed') {
          console.error('❌ Email/Password registration is DISABLED in Firebase Console');
        } else {
          console.log(`ℹ️ Email/Password registration attempt result: ${regError.code}`);
        }
      }
    } else {
      console.error('❌ Auth service test failed:', error.code, error.message);
      if (error.code === 'auth/configuration-not-found') {
        console.error('   Cause: The Firebase configuration in .env.local might be incorrect or the Web App is not properly set up in the Console.');
      }
      process.exit(1);
    }
  }

  console.log('--- Firestore Smoke Test ---');
  const db = getFirestore(app);
  try {
    const testDoc = doc(db, 'system', 'health-check');
    await getDoc(testDoc);
    console.log('✅ Firestore service is reachable');
  } catch (error) {
    console.error('❌ Firestore service test failed:', error.code, error.message);
  }

  console.log('--- End of Smoke Test ---');
}

runTests().catch(console.error);
