/**
 * Rules unit test using Firebase Emulator.
 * Tests exact onboarding Firestore write to find which rule fails.
 */
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { setDoc, updateDoc, doc, Timestamp } from 'firebase/firestore'

const PROJECT_ID = 'adoracion-app-57d56'
const RULES = readFileSync('./firestore.rules', 'utf8')

const today = new Date().toISOString().split('T')[0]

function makeUserDoc(uid, email, charOverrides = {}) {
  const now = Timestamp.now()
  return {
    uid,
    email,
    displayName: 'Test User',
    photoURL: null,
    role: 'member',
    status: 'active',
    createdAt: now,
    lastLoginAt: now,
    onboardingCompleted: false,
    selectedChurchCampus: null,
    character: {
      gender: 'boy',
      stage: 1,
      assetKey: null,
      ...charOverrides,
    },
    progress: {
      xp: 0,
      level: 1,
      streakDays: 0,
      longestStreak: 0,
      lastActivityDate: today,
      totalPrayersOffered: 0,
    },
  }
}

async function main() {
  let testEnv
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: RULES,
        host: '127.0.0.1',
        port: 8080,
      },
    })
  } catch (e) {
    console.error('Could not initialize test environment:', e.message)
    process.exit(1)
  }

  const uid = 'test-onboarding-user'
  const email = 'test@adoracion.app'

  console.log('\n═══ Firestore Rules Unit Tests ═══\n')

  // ── Test 1: Can create a new user document? ──────────────────────────────
  console.log('Test 1: Create user document (gender:boy, stage:1)')
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    // Clean up first
    await ctx.firestore().doc(`users/${uid}`).delete().catch(() => {})
  })

  const authedCtx = testEnv.authenticatedContext(uid, { email, email_verified: false })
  const authedDb = authedCtx.firestore()

  try {
    await assertSucceeds(
      setDoc(doc(authedDb, 'users', uid), makeUserDoc(uid, email))
    )
    console.log('  ✓ User doc creation ALLOWED (gender:boy, stage:1)')
  } catch (e) {
    console.log('  ✗ User doc creation DENIED — this explains the bug!')
    console.log('  Error:', e.message)
    console.log('\n  → The root cause is that email/password users without email_verified=true')
    console.log('    may fail the email check, OR the timestamp format differs')
  }

  // ── Test 2: Create with email_verified:true ──────────────────────────────
  console.log('\nTest 2: Create user doc with email_verified:true (Google Sign-In)')
  const authedCtxVerified = testEnv.authenticatedContext(uid + '_v', {
    email: email,
    email_verified: true,
  })
  const authedDbV = authedCtxVerified.firestore()

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`users/${uid}_v`).delete().catch(() => {})
  })

  try {
    await assertSucceeds(
      setDoc(doc(authedDbV, 'users', uid + '_v'), makeUserDoc(uid + '_v', email))
    )
    console.log('  ✓ User doc creation ALLOWED with email_verified:true')
  } catch (e) {
    console.log('  ✗ DENIED with email_verified:true too')
    console.log('  Error:', e.message)
  }

  // ── Setup: write doc via admin to test updates ───────────────────────────
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`users/${uid}`).set(makeUserDoc(uid, email))
  })
  console.log('\n[Setup] Created user doc via admin (bypassing rules)')

  // ── Test 3: lastLoginAt update ───────────────────────────────────────────
  console.log('\nTest 3: Update lastLoginAt only')
  try {
    await assertSucceeds(
      updateDoc(doc(authedDb, 'users', uid), { lastLoginAt: Timestamp.now() })
    )
    console.log('  ✓ lastLoginAt update ALLOWED')
  } catch (e) {
    console.log('  ✗ lastLoginAt update DENIED')
    console.log('  Error:', e.message)
  }

  // ── Test 4: THE KEY TEST — onboarding update, pre-fix char structure ─────
  console.log('\nTest 4: Onboarding update — gender:boy→male, stage:1 (pre-fix)')
  try {
    await assertSucceeds(
      updateDoc(doc(authedDb, 'users', uid), {
        onboardingCompleted: true,
        'character.gender': 'male',
      })
    )
    console.log('  ✓ Onboarding update ALLOWED')
  } catch (e) {
    console.log('  ✗ Onboarding update DENIED ← ROOT CAUSE FOUND')
    console.log('  Error:', e.message)
  }

  // ── Test 5: Narrow — just onboardingCompleted ────────────────────────────
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`users/${uid}`).set(makeUserDoc(uid, email))
  })
  console.log('\nTest 5: Only onboardingCompleted (no character change)')
  try {
    await assertSucceeds(
      updateDoc(doc(authedDb, 'users', uid), { onboardingCompleted: true })
    )
    console.log('  ✓ onboardingCompleted-only update ALLOWED')
  } catch (e) {
    console.log('  ✗ DENIED')
    console.log('  Error:', e.message)
  }

  // ── Test 6: Narrow — just character.gender ───────────────────────────────
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`users/${uid}`).set(makeUserDoc(uid, email))
  })
  console.log('\nTest 6: Only character.gender change (no onboardingCompleted)')
  try {
    await assertSucceeds(
      updateDoc(doc(authedDb, 'users', uid), { 'character.gender': 'male' })
    )
    console.log('  ✓ character.gender-only update ALLOWED')
  } catch (e) {
    console.log('  ✗ DENIED')
    console.log('  Error:', e.message)
  }

  // ── Test 7: Post-fix structure (stage:baby) ──────────────────────────────
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`users/${uid}`).set(
      makeUserDoc(uid, email, { gender: 'male', stage: 'baby' })
    )
  })
  console.log('\nTest 7: Onboarding update — stage:baby (post-fix structure)')
  try {
    await assertSucceeds(
      updateDoc(doc(authedDb, 'users', uid), {
        onboardingCompleted: true,
        'character.gender': 'female',
      })
    )
    console.log('  ✓ Post-fix onboarding update ALLOWED')
  } catch (e) {
    console.log('  ✗ DENIED')
    console.log('  Error:', e.message)
  }

  // ── Test 8: lastLoginAt + onboardingCompleted + character.gender ─────────
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`users/${uid}`).set(makeUserDoc(uid, email))
  })
  console.log('\nTest 8: Full update including lastLoginAt')
  try {
    await assertSucceeds(
      updateDoc(doc(authedDb, 'users', uid), {
        lastLoginAt: Timestamp.now(),
        onboardingCompleted: true,
        'character.gender': 'male',
      })
    )
    console.log('  ✓ ALLOWED')
  } catch (e) {
    console.log('  ✗ DENIED')
    console.log('  Error:', e.message)
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await testEnv.cleanup()
  console.log('\n═══ Tests complete ═══\n')
}

main().catch(e => { console.error(e); process.exit(1) })
