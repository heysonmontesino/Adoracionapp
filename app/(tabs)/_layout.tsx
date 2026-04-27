import { Tabs } from 'expo-router'
import { Platform, StyleSheet, View } from 'react-native'
import { BlurView } from 'expo-blur'
import { Tokens } from '../../src/shared/constants/tokens'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * PRODUCTION SPECIFICATION:
 * Type: Fixed Full-Width Tab Bar
 * Height: 50pt + Safe Area
 * Background: #1A172E (Blur Tint)
 */

function TabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tabBarTopBorder} />
    </View>
  )
}

function TabBarIcon({
  color,
  focused,
  name,
  size = 24,
}: {
  color: string
  focused: boolean
  name: keyof typeof Ionicons.glyphMap
  size?: number
}) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={name}
        size={size}
        color={color}
      />
    </View>
  )
}

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  const customHeight = 50 + insets.bottom

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Tokens.colors.primary,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.45)',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: customHeight,
            paddingBottom: insets.bottom > 0 ? insets.bottom - 4 : 8,
          },
        ],
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              name={focused ? 'home' : 'home-outline'}
            />
          ),
        }} 
      />
      <Tabs.Screen 
        name="content/index" 
        options={{ 
          title: 'Contenido',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              name={focused ? 'play-circle' : 'play-circle-outline'}
            />
          ),
        }} 
      />
      <Tabs.Screen
        name="community/index"
        options={{
          title: 'Comunidad',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              name={focused ? 'people' : 'people-outline'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bible-tab"
        options={{
          title: 'Biblia',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              name={focused ? 'book' : 'book-outline'}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="progress/index" 
        options={{ 
          title: 'Progreso',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
            />
          ),
        }} 
      />
      {/* Hidden Routes */}
      <Tabs.Screen name="character-preview" options={{ href: null }} />

      <Tabs.Screen name="content/announcements/index" options={{ href: null }} />
      <Tabs.Screen name="content/pastoral-messages/index" options={{ href: null }} />
      <Tabs.Screen name="content/pastoral-messages/[id]" options={{ href: null }} />
      <Tabs.Screen name="content/predicas/index" options={{ href: null }} />
      <Tabs.Screen name="content/predicas/[id]" options={{ href: null }} />
      <Tabs.Screen name="content/predicas/series/index" options={{ href: null }} />
      <Tabs.Screen name="content/predicas/series/[slug]" options={{ href: null }} />
      <Tabs.Screen name="content/sermons/index" options={{ href: null }} />
      <Tabs.Screen name="content/sermons/[id]" options={{ href: null }} />
      <Tabs.Screen name="community/chat/index" options={{ href: null }} />
      <Tabs.Screen name="community/events/index" options={{ href: null }} />
      <Tabs.Screen name="community/groups/index" options={{ href: null }} />
      <Tabs.Screen name="community/prayers/index" options={{ href: null }} />
      <Tabs.Screen name="community/prayer-requests/index" options={{ href: null }} />
      <Tabs.Screen name="community/prayer-requests/create" options={{ href: null }} />
      <Tabs.Screen name="community/prayer-requests/edit" options={{ href: null }} />
      <Tabs.Screen name="community/prayer-requests/[id]" options={{ href: null }} />
      <Tabs.Screen name="community/services/index" options={{ href: null }} />
      <Tabs.Screen name="community/channels/index" options={{ href: null }} />
      <Tabs.Screen name="community/channels/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile/detail" options={{ href: null }} />
      <Tabs.Screen name="profile/notifications" options={{ href: null }} />
      <Tabs.Screen name="profile/personal-data" options={{ href: null }} />
      <Tabs.Screen name="profile/account" options={{ href: null }} />
      <Tabs.Screen name="profile/help" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBarLabel: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.1,
    marginTop: 0,
    marginBottom: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
})
