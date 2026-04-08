import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../src/shared/components/layout/Screen'

interface CommunitySection {
  key: string
  title: string
  subtitle: string
  route: string
  badge?: string
}

const SECTIONS: CommunitySection[] = [
  {
    key: 'prayer-requests',
    title: 'Peticiones de Oración',
    subtitle: 'Comparte y ora por las necesidades de la comunidad',
    route: '/(tabs)/community/prayer-requests',
  },
  {
    key: 'channels',
    title: 'Canales',
    subtitle: 'Mensajes y avisos del liderazgo de la iglesia',
    route: '/(tabs)/community/channels',
  },
  {
    key: 'services',
    title: 'Servicios',
    subtitle: 'Horarios y ubicaciones de los cultos',
    route: '/(tabs)/community/services',
  },
]

export default function CommunityScreen() {
  const router = useRouter()

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View className="mb-2">
          <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
            COMUNIDAD
          </Text>
          <Text className="font-jakarta-regular text-base text-on-surface/70">
            Un lugar para orar juntos, mantenerse conectados y crecer en fe.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.key}
            className="rounded-3xl bg-surface-container-low p-6"
            onPress={() => router.push(section.route as never)}
            activeOpacity={0.86}
          >
            <Text className="font-jakarta-bold text-xl text-on-surface mb-2">
              {section.title}
            </Text>
            <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
              {section.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  )
}
