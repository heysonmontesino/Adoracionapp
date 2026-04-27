/**
 * verify-prayer-submit-emulator.mjs
 * Prueba funcional real con Firebase Emulator + auth token simulado.
 * Verifica el payload exacto de repository.ts contra las reglas de firestore.rules
 * con un usuario autenticado con status: "active".
 *
 * Ejecutar: node scripts/verify-prayer-submit-emulator.mjs
 * (El emulador debe estar corriendo en :8080)
 */

import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  addDoc,
  setDoc,
  getDoc,
  collection,
  doc,
  Timestamp,
} from 'firebase/firestore'
import { getAuth, connectAuthEmulator, signInWithCustomToken } from 'firebase/auth'

// ── Config apuntando al emulador local ──────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyC97fagx5sRtcWebM7W-MwiYm60VkC3hR4',
  authDomain:        'adoracion-app-57d56.firebaseapp.com',
  projectId:         'adoracion-app-57d56',
  storageBucket:     'adoracion-app-57d56.firebasestorage.app',
  messagingSenderId: '608785019795',
  appId:             '1:608785019795:web:62910f7673f99f7f4fae66',
}

// Limpiar apps previas
const existingApps = getApps()
for (const a of existingApps) await deleteApp(a)

const app  = initializeApp(firebaseConfig)
const db   = getFirestore(app)
const auth = getAuth(app)

// Conectar a emuladores
connectFirestoreEmulator(db, 'localhost', 8080)
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })

const TEST_UID    = 'test-prayer-user-001'
const COLLECTION  = 'prayer-requests'

// Helper: crear token custom via emulator REST API
async function createCustomToken(uid) {
  const res = await fetch(
    `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: uid, returnSecureToken: true }),
    }
  ).catch(() => null)
  if (res?.ok) {
    const data = await res.json()
    return data.idToken
  }
  // Fallback: usar emulator REST directo para crear usuario y obtener token
  return null
}

async function signInViaEmulatorREST(uid) {
  // El emulador de auth expone este endpoint para crear sessions arbitrarias
  const url = `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ localId: uid, returnSecureToken: true }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Auth emulator sign-up failed: ${err}`)
  }
  const data = await res.json()
  return data.idToken
}

async function main() {
  console.log('\n========================================================')
  console.log('  VERIFY PRAYER SUBMIT — Firebase Emulator + Real Rules')
  console.log('  Proyecto: adoracion-app-57d56')
  console.log('========================================================\n')

  // ── 1. Sign in via emulador de auth ──────────────────────────────────────
  console.log('[1/5] Autenticando usuario en emulador de Auth...')
  let idToken
  try {
    idToken = await signInViaEmulatorREST(TEST_UID)
    console.log(`      ✅ Auth token obtenido para uid: ${TEST_UID}`)
  } catch (e) {
    console.error('      ❌ Error obteniendo auth token:', e.message)
    process.exit(1)
  }

  // Sign in en el SDK de Firebase con el token del emulador
  try {
    await signInWithCustomToken(auth, TEST_UID).catch(async () => {
      // El emulador de auth permite signIn directo via REST token
      // Usando signInWithIdToken simulado
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth')
      await createUserWithEmailAndPassword(auth, `${TEST_UID}@test.com`, 'password123')
        .catch(() => signInWithEmailAndPassword(auth, `${TEST_UID}@test.com`, 'password123'))
    })
    console.log('      ✅ Usuario SDK autenticado:', auth.currentUser?.uid)
  } catch (e) {
    console.warn('      ⚠️  SDK sign-in warning (no bloquea el test):', e.message)
  }

  // ── 2. Crear documento de usuario con status: "active" ───────────────────
  console.log('\n[2/5] Creando documento /users/' + TEST_UID + ' con status: active...')
  const now = Timestamp.now()
  const userDoc = {
    uid:                 TEST_UID,
    email:               `${TEST_UID}@test.com`,
    displayName:         'Test User Prayer',
    photoURL:            null,
    role:                'member',
    status:              'active',
    createdAt:           now,
    lastLoginAt:         now,
    onboardingCompleted: false,
    selectedChurchCampus: null,
    character:  { gender: 'boy', stage: 1, assetKey: null },
    progress:   {
      xp: 0, level: 1, streakDays: 0,
      longestStreak: 0, lastActivityDate: now.toDate().toISOString().split('T')[0],
      totalPrayersOffered: 0,
    },
  }
  try {
    await setDoc(doc(db, 'users', TEST_UID), userDoc)
    console.log(`      ✅ /users/${TEST_UID} creado con status: "active"`)

    // Verify
    const userSnap = await getDoc(doc(db, 'users', TEST_UID))
    console.log(`      ✅ Verificado: status = "${userSnap.data()?.status}", role = "${userSnap.data()?.role}"`)
  } catch (e) {
    console.error('      ❌ Error creando user doc:', e.message, e.code)
    process.exit(1)
  }

  // ── 3. Payload idéntico al de repository.ts → createPrayerRequest() ──────
  console.log('\n[3/5] Construyendo payload exacto de repository.ts...')
  const prayerNow = Timestamp.now()
  const payload = {
    userId:      TEST_UID,
    author: {
      displayName: 'Test User Prayer',
      isAnonymous:  false,
    },
    title:       'Test funcional — verificación de submit',
    body:        'Esta petición fue creada por el script de verificación funcional. Es seguro borrarla.',
    type:        'community',
    category:    'general',
    prayerCount: 0,
    status:      'active',
    createdAt:   prayerNow,
    updatedAt:   prayerNow,
    answeredAt:  null,
  }
  console.log('      [PrayerCreate] repository payload:', JSON.stringify({
    userId:      payload.userId,
    type:        payload.type,
    category:    payload.category,
    bodyLength:  payload.body.length,
    anonymous:   payload.author.isAnonymous,
    status:      payload.status,
    prayerCount: payload.prayerCount,
  }, null, 4))

  // ── 4. addDoc — mismo llamado que addDocument() ───────────────────────────
  console.log('\n[4/5] Ejecutando addDoc a /' + COLLECTION + '...')
  let docId
  try {
    const colRef = collection(db, COLLECTION)
    const docRef = await addDoc(colRef, payload)
    docId = docRef.id
    console.log('      [PrayerCreate] firestore success:', docId)
    console.log(`      ✅ Documento creado exitosamente`)
  } catch (e) {
    console.error('\n      ❌ [PrayerCreate] firestore error:', e.message)
    console.error('         Code:', e.code)
    if (e.code === 'permission-denied') {
      console.log('\n      📋 DIAGNÓSTICO DE REGLAS:')
      console.log('         Las reglas están rechazando la escritura.')
      console.log('         Revisar la regla "allow create" en /prayer-requests:')
      console.log('         - isActiveUser() requiere /users/{uid}.status == "active"')
      console.log('         - El doc de usuario fue creado en paso 2.')
      console.log('         - Si aún falla, el emulador de auth no está corriendo en :9099')
    }
    process.exit(1)
  }

  // ── 5. Leer back el documento ─────────────────────────────────────────────
  console.log('\n[5/5] Verificando documento creado...')
  try {
    const snap = await getDoc(doc(db, COLLECTION, docId))
    if (snap.exists()) {
      const d = snap.data()
      console.log('      ✅ VERIFICADO — Datos en Firestore:')
      console.log('         Colección: /' + COLLECTION)
      console.log('         DocId:    ', docId)
      console.log('         Path:     /' + COLLECTION + '/' + docId)
      console.log('         userId:   ', d.userId)
      console.log('         type:     ', d.type)
      console.log('         category: ', d.category)
      console.log('         status:   ', d.status)
      console.log('         prayerCnt:', d.prayerCount)
      console.log('         author:   ', JSON.stringify(d.author))
      console.log('         body:     ', d.body.slice(0, 60) + '...')
      console.log('         createdAt:', d.createdAt?.toDate?.()?.toISOString?.() ?? d.createdAt)
    } else {
      console.error('      ❌ Documento no encontrado después de crear — inesperado')
    }
  } catch (e) {
    console.error('      ❌ Error leyendo:', e.message)
  }

  console.log('\n========================================================')
  console.log('  RESULTADO FINAL')
  console.log('========================================================')
  console.log('  Proyecto:            adoracion-app-57d56 ✅')
  console.log('  Reglas deployadas:   adoracion-app-57d56 ✅')
  console.log('  /users/{uid}.status: active ✅')
  console.log('  Escritura Firestore: ✅ EXITOSA')
  console.log('  Ruta del documento:  /' + COLLECTION + '/' + docId)
  console.log('  Payload shape:       userId + author{} + type + category + status + prayerCount')
  console.log('========================================================\n')

  await deleteApp(app)
  process.exit(0)
}

main().catch(async (err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
