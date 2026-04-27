const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// Allow Metro to bundle .glb (binary glTF) and .gltf files as static assets.
// Without this, require('../assets/character/baby_boy/spirit_baby_boy.glb')
// will throw "Unable to resolve module" at build time.
config.resolver.assetExts = [
  ...(config.resolver.assetExts ?? []),
  'glb',
  'gltf',
  'bin',
]

module.exports = withNativeWind(config, { input: './global.css' })
