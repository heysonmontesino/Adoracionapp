/**
 * Route: /(tabs)/character-preview
 *
 * Demo screen for 3D character testing. Not shown in the tab bar.
 * Access from the progress screen debug button or navigate directly.
 *
 * To add a temporary shortcut in the progress screen:
 *   import { useRouter } from 'expo-router'
 *   const router = useRouter()
 *   <TouchableOpacity onPress={() => router.push('/(tabs)/character-preview')}>
 *     <Text>Ver demo personaje</Text>
 *   </TouchableOpacity>
 */
import { SpiritualCharacterPreviewScreen } from '../../src/features/character/3d/SpiritualCharacterPreviewScreen'

export default SpiritualCharacterPreviewScreen
