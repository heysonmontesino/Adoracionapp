import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(cwd, relativePath), 'utf8'))
}

function readText(relativePath) {
  return fs.readFileSync(path.join(cwd, relativePath), 'utf8')
}

function readEnvValue(envText, key) {
  const match = envText.match(new RegExp(`^${key}=(.*)$`, 'm'))
  return match ? match[1].trim() : ''
}

function status(ok, label, details) {
  return {
    ok,
    label,
    details,
  }
}

const packageJson = readJson('package.json')
const appJson = readJson('app.json')
const easJson = readJson('eas.json')
const envText = readText('.env.local')
const googleServices = readJson('google-services.json')
const googleServicePlist = readText('GoogleService-Info.plist')

const expoConfig = appJson.expo ?? {}
const plugins = expoConfig.plugins ?? []
const pluginNames = plugins.map((plugin) =>
  Array.isArray(plugin) ? plugin[0] : plugin,
)

const webClientId = readEnvValue(envText, 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID')
const iosHasWebClientIdEntry = googleServicePlist.includes('<key>WEB_CLIENT_ID</key>')
const androidOauthClients = (googleServices.client ?? []).flatMap(
  (client) => client.oauth_client ?? [],
)

const checks = [
  status(
    packageJson.main === 'expo-router/entry',
    'Expo Router entrypoint',
    `main=${packageJson.main}`,
  ),
  status(
    packageJson.dependencies?.['expo-dev-client'],
    'expo-dev-client installed',
    packageJson.dependencies?.['expo-dev-client']
      ? `version=${packageJson.dependencies['expo-dev-client']}`
      : 'missing dependency',
  ),
  status(
    pluginNames.includes('@react-native-google-signin/google-signin'),
    'Google Sign-In config plugin',
    pluginNames.includes('@react-native-google-signin/google-signin')
      ? 'configured in app.json'
      : 'missing from app.json plugins',
  ),
  status(
    pluginNames.includes('expo-dev-client'),
    'expo-dev-client plugin',
    pluginNames.includes('expo-dev-client')
      ? 'configured in app.json'
      : 'missing from app.json plugins',
  ),
  status(
    expoConfig.ios?.googleServicesFile === './GoogleService-Info.plist',
    'iOS Firebase config file',
    `ios.googleServicesFile=${expoConfig.ios?.googleServicesFile ?? 'missing'}`,
  ),
  status(
    expoConfig.android?.googleServicesFile === './google-services.json',
    'Android Firebase config file',
    `android.googleServicesFile=${expoConfig.android?.googleServicesFile ?? 'missing'}`,
  ),
  status(
    easJson.build?.development?.developmentClient === true,
    'EAS development client profile',
    `development.developmentClient=${String(
      easJson.build?.development?.developmentClient ?? false,
    )}`,
  ),
  status(
    webClientId.length > 0,
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    webClientId.length > 0 ? 'set' : 'missing or empty',
  ),
  status(
    iosHasWebClientIdEntry,
    'GoogleService-Info.plist WEB_CLIENT_ID',
    iosHasWebClientIdEntry ? 'present' : 'missing',
  ),
  status(
    androidOauthClients.length > 0,
    'google-services.json oauth_client entries',
    `count=${androidOauthClients.length}`,
  ),
]

const resolved = checks.filter((check) => check.ok)
const blocked = checks.filter((check) => !check.ok)

console.log('Google Sign-In readiness report\n')

for (const check of checks) {
  const marker = check.ok ? 'PASS' : 'FAIL'
  console.log(`${marker}  ${check.label} — ${check.details}`)
}

console.log('\nSummary')
console.log(`Resolved in local code/config: ${resolved.length}`)
console.log(`External or local config blockers: ${blocked.length}`)

if (blocked.length > 0) {
  console.log('\nRemaining blockers')

  for (const check of blocked) {
    console.log(`- ${check.label}: ${check.details}`)
  }
}
