/**
 * Diagnostic: narrows down which Firestore security rule is failing.
 * Uses Firebase Auth REST + Firestore REST with explicit Bearer token.
 * No Firebase SDK needed — pure fetch.
 */

const PROJECT = 'adoracion-app-57d56'
const API_KEY = 'AIzaSyC97fagx5sRtcWebM7W-MwiYm60VkC3hR4'
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts`
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

function ok(label, detail = '') { console.log(`  ✓ ${label}${detail ? ': ' + detail : ''}`) }
function fail(label, detail = '') { console.log(`  ✗ ${label}${detail ? ': ' + detail : ''}`) }

// ── JWT decode (no verification — just inspect claims) ─────────────────────

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

// ── Auth REST ──────────────────────────────────────────────────────────────

async function signUp(email, password) {
  const r = await fetch(`${AUTH_URL}:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const j = await r.json()
  if (!r.ok) throw Object.assign(new Error(j.error?.message), { detail: j.error })
  return j
}

async function deleteAuthUser(idToken) {
  await fetch(`${AUTH_URL}:delete?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
}

// ── Firestore REST ─────────────────────────────────────────────────────────

function fsVal(value) {
  if (value === null) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  if (typeof value === 'string') return { stringValue: value }
  if (value?.__type === 'timestamp') {
    return { timestampValue: value.iso }
  }
  if (value && typeof value === 'object') {
    const fields = {}
    for (const [k, v] of Object.entries(value)) fields[k] = fsVal(v)
    return { mapValue: { fields } }
  }
  throw new Error(`Cannot convert: ${JSON.stringify(value)}`)
}

function fsDoc(data) {
  const fields = {}
  for (const [k, v] of Object.entries(data)) fields[k] = fsVal(v)
  return { fields }
}

function nowTs() {
  return { __type: 'timestamp', iso: new Date().toISOString() }
}

async function fsWrite(idToken, uid, data, maskPaths = null) {
  let url = `${FS_BASE}/users/${uid}`
  if (maskPaths) {
    url += '?' + maskPaths.map(p => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join('&')
  }
  const r = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(fsDoc(data)),
  })
  const j = await r.json()
  if (!r.ok) throw Object.assign(new Error(j.error?.message), { code: j.error?.status, detail: j.error })
  return j
}

async function fsRead(idToken, uid) {
  const r = await fetch(`${FS_BASE}/users/${uid}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  })
  const j = await r.json()
  if (!r.ok) return null
  // Convert back to plain values (simplified)
  const out = {}
  for (const [k, v] of Object.entries(j.fields || {})) {
    if ('stringValue' in v) out[k] = v.stringValue
    else if ('booleanValue' in v) out[k] = v.booleanValue
    else if ('integerValue' in v) out[k] = Number(v.integerValue)
    else if ('nullValue' in v) out[k] = null
    else if ('timestampValue' in v) out[k] = v.timestampValue
    else if ('mapValue' in v) out[k] = '[map]'
    else out[k] = '[unknown]'
  }
  return out
}

// ── Test helper ────────────────────────────────────────────────────────────

async function tryCreate(idToken, uid, data, label) {
  try {
    await fsWrite(idToken, uid, data)
    ok(`CREATE ok — ${label}`)
    return true
  } catch (e) {
    fail(`CREATE failed — ${label}`, `${e.code}`)
    return false
  }
}

async function tryUpdate(idToken, uid, data, maskPaths, label) {
  try {
    await fsWrite(idToken, uid, data, maskPaths)
    ok(`UPDATE ok — ${label}`)
    return true
  } catch (e) {
    fail(`UPDATE failed — ${label}`, `${e.code}`)
    return false
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function run() {
  const testEmail = `diag-${Date.now()}@test.adoracion.dev`
  const testPassword = 'D1agn0stic!Pass'

  console.log('\n═══════════════════════════════════════════════════')
  console.log(' Onboarding Firestore Security Rules Diagnostic')
  console.log(`═══════════════════════════════════════════════════`)

  // 1. Create Auth user
  let session
  try {
    session = await signUp(testEmail, testPassword)
    ok(`Auth: user created — uid=${session.localId}`)
  } catch (e) {
    fail('Auth: signUp failed', e.message)
    console.log('  detail:', e.detail)
    process.exit(1)
  }

  const { idToken, localId: uid } = session

  // 2. Decode JWT — confirm claims
  const claims = decodeJwt(idToken)
  console.log('\n  JWT claims:')
  console.log(`    uid (sub): ${claims?.sub}`)
  console.log(`    email: ${claims?.email}`)
  console.log(`    email_verified: ${claims?.email_verified}`)
  console.log(`    uid matches localId: ${claims?.sub === uid}`)
  console.log(`    email matches payload email: ${claims?.email === testEmail}`)

  const today = new Date().toISOString().split('T')[0]

  // Full valid document (as app creates it)
  function makeDoc({ gender = 'boy', stage = 1, onboardingCompleted = false, extraKeys = {} } = {}) {
    return {
      uid,
      email: testEmail,
      displayName: 'Diagnostic User',
      photoURL: null,
      role: 'member',
      status: 'active',
      createdAt: nowTs(),
      lastLoginAt: nowTs(),
      onboardingCompleted,
      selectedChurchCampus: null,
      character: { gender, stage, assetKey: null },
      progress: {
        xp: 0, level: 1, streakDays: 0, longestStreak: 0,
        lastActivityDate: today, totalPrayersOffered: 0,
      },
      ...extraKeys,
    }
  }

  console.log('\n─── Phase 1: validUserCreate conditions ───')

  // Test A: Full document — pre-fix structure
  const createdA = await tryCreate(idToken, uid, makeDoc({ gender: 'boy', stage: 1 }), 'full doc gender:boy stage:1')

  if (!createdA) {
    // Try to understand WHY by narrowing conditions

    // Test A1: email matches? Mess it up intentionally
    console.log('\n  Narrowing: testing which condition fails...')

    // A1: Try with wrong email in doc to confirm "email match" matters
    await tryCreate(idToken, uid, { ...makeDoc(), email: 'wrong@wrong.com' }, 'wrong email in doc')

    // A2: Try with extra key to check hasOnly
    await tryCreate(idToken, uid, { ...makeDoc(), extraField: 'x' }, 'extra key in doc')

    // A3: Read an existing user doc (if any) to compare
    const read = await fsRead(idToken, uid)
    if (read) {
      console.log('  Existing doc:', JSON.stringify(read))
    } else {
      console.log('  No existing doc (expected for new user)')
    }

    console.log('\n  ⚠ validUserCreate is DENYING the document creation.')
    console.log('  Most likely causes:')
    console.log('  1. JWT email claim doesn\'t match doc.email')
    console.log('  2. Timestamp format rejected by "is timestamp" check')
    console.log('  3. A validCharacter or validProgress condition')
    console.log('\n  JWT email claim:', claims?.email)
    console.log('  Document email:', testEmail)
    console.log('  Match:', claims?.email === testEmail)
  }

  if (createdA) {
    console.log('\n─── Phase 2: lastLoginAt update ───')
    await tryUpdate(idToken, uid, { lastLoginAt: nowTs() }, ['lastLoginAt'], 'update lastLoginAt only')

    console.log('\n─── Phase 3: onboarding update (THE KEY TEST) ───')
    console.log('  Payload: { onboardingCompleted:true, character.gender:"male" }')
    console.log('  Existing character before update: gender:boy, stage:1')

    const updatedMain = await tryUpdate(
      idToken,
      uid,
      { onboardingCompleted: true, character: { gender: 'male' } },
      ['onboardingCompleted', 'character.gender'],
      'onboarding update (gender:boy→male, stage:1 unchanged)',
    )

    if (updatedMain) {
      const docAfter = await fsRead(idToken, uid)
      console.log('  Doc after update:', JSON.stringify(docAfter))
    } else {
      console.log('\n  ← THIS IS THE BUG. Narrowing further...')

      // Try without the character change — just onboardingCompleted
      await tryUpdate(
        idToken, uid,
        { onboardingCompleted: true },
        ['onboardingCompleted'],
        'only onboardingCompleted (no character change)',
      )

      // Try only character.gender change without onboardingCompleted
      await tryUpdate(
        idToken, uid,
        { character: { gender: 'male' } },
        ['character.gender'],
        'only character.gender male (no onboardingCompleted change)',
      )

      // Try lastLoginAt + character.gender (to see if the combo matters)
      await tryUpdate(
        idToken, uid,
        { lastLoginAt: nowTs(), character: { gender: 'male' } },
        ['lastLoginAt', 'character.gender'],
        'lastLoginAt + character.gender (without onboardingCompleted)',
      )
    }

    console.log('\n─── Phase 4: Post-fix structure (gender:male, stage:baby) ───')
    // Reset document
    await fsWrite(idToken, uid, makeDoc({ gender: 'male', stage: 'baby', onboardingCompleted: false }))
    await tryUpdate(
      idToken, uid,
      { onboardingCompleted: true, character: { gender: 'female' } },
      ['onboardingCompleted', 'character.gender'],
      'post-fix: gender:male→female, stage:baby unchanged',
    )
  }

  // Cleanup
  console.log('\n─── Cleanup ───')
  await deleteAuthUser(idToken)
  ok('Auth user deleted')
  console.log('\n═══════════════════════════════════════════════════\n')
}

run().catch(e => { console.error('Fatal:', e); process.exit(1) })
