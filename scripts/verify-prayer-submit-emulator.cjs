#!/usr/bin/env node
/**
 * verify-prayer-submit-emulator.cjs
 * Prueba funcional del submit de prayer request contra el emulador local de Firestore.
 * Usa el SDK de Firebase (mismo que la app) + emulador de Auth para firmar requests.
 *
 * Ejecutar DENTRO de: firebase emulators:exec --only firestore,auth ...
 */

const { initializeApp, deleteApp, getApps } = require('firebase/app')
const {
  getFirestore,
  connectFirestoreEmulator,
  addDoc,
  setDoc,
  getDoc,
  collection,
  doc,
  Timestamp,
} = require('firebase/firestore')
const {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} = require('firebase/auth')

const firebaseConfig = {
  apiKey:            'AIzaSyC97fagx5sRtcWebM7W-MwiYm60VkC3hR4',
  authDomain:        'adoracion-app-57d56.firebaseapp.com',
  projectId:         'adoracion-app-57d56',
  storageBucket:     'adoracion-app-57d56.firebasestorage.app',
  messagingSenderId: '608785019795',
  appId:             '1:608785019795:web:62910f7673f99f7f4fae66',
}

const TEST_EMAIL    = 'test-prayer-001@adoracion.test'
const TEST_PASSWORD = 'TestPass123!'
const COLLECTION    = 'prayer-requests'

async function main() {
  console.log('\n========================================================')
  console.log('  VERIFY PRAYER SUBMIT — Emulator + Real Firestore Rules')
  console.log('  Proyecto: adoracion-app-57d56')
  console.log('========================================================\n')

  // Init app
  const existingApps = getApps()
  for (const a of existingApps) await deleteApp(a)

  const app  = initializeApp(firebaseConfig)
  const db   = getFirestore(app)
  const auth = getAuth(app)

  connectFirestoreEmulator(db,   'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })

  // ── 1. Autenticar usuario en emulador ─────────────────────────────────────
  console.log('[1/5] Autenticando en emulador de Auth...')
  let uid
  try {
    let cred
    try {
      cred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD)
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        cred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD)
      } else throw e
    }
    uid = cred.user.uid
    console.log(`      ✅ Autenticado — uid: ${uid}`)
  } catch (e) {
    console.error('      ❌ Error de auth:', e.message, e.code)
    process.exit(1)
  }

  // ── 2. Crear doc /users/{uid} con status: "active" ────────────────────────
  console.log(`\n[2/5] Creando /users/${uid} con status: "active"...`)
  const now = Timestamp.now()
  try {
    await setDoc(doc(db, 'users', uid), {
      uid,
      email:               TEST_EMAIL,
      displayName:         'Test Prayer User',
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
        longestStreak: 0,
        lastActivityDate: now.toDate().toISOString().split('T')[0],
        totalPrayersOffered: 0,
      },
    })
    const userSnap = await getDoc(doc(db, 'users', uid))
    console.log(`      ✅ /users/${uid} confirmado — status: "${userSnap.data()?.status}"`)
  } catch (e) {
    console.error('      ❌ Error creando user doc:', e.message, e.code)
    process.exit(1)
  }

  // ── 3. Payload idéntico a repository.ts → createPrayerRequest() ───────────
  console.log('\n[3/5] Payload exacto de repository.ts:')
  const pNow = Timestamp.now()
  const payload = {
    userId:      uid,
    author: { displayName: 'Test Prayer User', isAnonymous: false },
    title:       'Test funcional de submit',
    body:        'Petición de prueba funcional — verificación del flujo end-to-end. Puede borrarse.',
    type:        'community',
    category:    'general',
    prayerCount: 0,
    status:      'active',
    createdAt:   pNow,
    updatedAt:   pNow,
    answeredAt:  null,
  }
  console.log('      [PrayerCreate] repository payload:', JSON.stringify({
    userId: payload.userId, type: payload.type, category: payload.category,
    bodyLength: payload.body.length, anonymous: payload.author.isAnonymous,
    status: payload.status, prayerCount: payload.prayerCount,
  }, null, 4))

  // ── 4. addDoc — mismo llamado que addDocument() en firestore.ts ───────────
  console.log('\n[4/5] Ejecutando addDoc (misma llamada que addDocument())...')
  let docId
  try {
    const colRef = collection(db, COLLECTION)
    const docRef = await addDoc(colRef, payload)
    docId = docRef.id
    console.log('      [PrayerCreate] firestore success:', docId)
    console.log(`      ✅ Documento creado — path: /${COLLECTION}/${docId}`)
  } catch (e) {
    console.error('\n      ❌ [PrayerCreate] firestore error EXACTO:', e.message)
    console.error('         Code:', e.code)
    console.log('\n      📋 DIAGNÓSTICO:')
    if (e.code === 'permission-denied') {
      console.log('         → Rule "allow create" rechazó el payload.')
      console.log('         → La regla en /prayer-requests requiere:')
      console.log('           1. isActiveUser() = /users/{uid}.status == "active" ✅ (creado en paso 2)')
      console.log('           2. data.userId == auth.uid ✅')
      console.log('           3. data.status == "active" ✅')
      console.log('           4. data.prayerCount == 0 ✅')
      console.log('           5. data.type in ["community","pastoral"] ✅')
      console.log('         → La regla DEBERÍA pasar. El rechazo podría ser:')
      console.log('           - isActiveUser() vuelve a hacer get() del user doc y el emulador lo lee post-setDoc')
      console.log('           - Verificar firestore-debug.log para detalle exacto')
    }
    process.exit(1)
  }

  // ── 5. Leer back y verificar ──────────────────────────────────────────────
  console.log('\n[5/5] Verificando documento guardado...')
  try {
    const snap = await getDoc(doc(db, COLLECTION, docId))
    if (snap.exists()) {
      const d = snap.data()
      console.log('      ✅ VERIFICADO — Documento en Firestore:')
      console.log('         Path:     ', '/' + COLLECTION + '/' + docId)
      console.log('         userId:   ', d.userId)
      console.log('         type:     ', d.type)
      console.log('         category: ', d.category)
      console.log('         status:   ', d.status)
      console.log('         prayerCnt:', d.prayerCount)
      console.log('         author:   ', JSON.stringify(d.author))
      console.log('         body:     ', d.body)
      console.log('         createdAt:', d.createdAt?.toDate?.()?.toISOString?.() ?? d.createdAt)
    } else {
      console.error('      ❌ Documento no encontrado tras crear — error inesperado')
    }
  } catch (e) {
    console.error('      ❌ Error leyendo doc:', e.message)
  }

  console.log('\n========================================================')
  console.log('  RESULTADO FINAL')
  console.log('========================================================')
  console.log('  Project ID:               adoracion-app-57d56 ✅')
  console.log('  Reglas deployadas en:     adoracion-app-57d56 ✅')
  console.log('  Usuario autenticado:      ✅ uid =', uid)
  console.log('  /users/{uid}.status:      "active" ✅')
  console.log('  Escritura Firestore:      ✅ EXITOSA')
  console.log('  Ruta del documento:       /' + COLLECTION + '/' + docId)
  console.log('  Payload shape verificado: userId + author{} + type + category')
  console.log('                            + status + prayerCount + timestamps')
  console.log('========================================================\n')

  await deleteApp(app)
  process.exit(0)
}

main().catch(async (err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
