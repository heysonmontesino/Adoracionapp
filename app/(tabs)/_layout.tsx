import { Tabs } from 'expo-router'
import { Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { Colors } from '../../src/shared/constants/colors'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.onSurface60,
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans-Medium',
          fontSize: 11,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor:
            Platform.OS === 'ios' ? 'transparent' : Colors.surfaceBright,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground:
          Platform.OS === 'ios'
            ? () => (
                <BlurView
                  intensity={80}
                  tint="dark"
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )
            : undefined,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="content/index" options={{ title: 'Contenido' }} />
      <Tabs.Screen name="community/index" options={{ title: 'Comunidad' }} />
      <Tabs.Screen name="progress/index" options={{ title: 'Progreso' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Perfil' }} />
    </Tabs>
  )
}
