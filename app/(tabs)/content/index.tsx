import { Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../src/shared/components/layout/Screen'

export default function ContentScreen() {
  const router = useRouter()

  return (
    <Screen>
      <View className="flex-1 px-6 pt-8">
        <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
          CONTENIDO
        </Text>
        <Text className="font-jakarta-regular text-base text-on-surface/70 mb-8">
          Base lista para entrar a contenido real sin salirnos todavía a YouTube API.
        </Text>

        <View className="gap-4">
          <TouchableOpacity
            className="rounded-3xl bg-surface-container-low p-5"
            onPress={() => router.push('/(tabs)/content/sermons')}
            activeOpacity={0.86}
          >
            <Text className="font-humane text-4xl uppercase text-on-surface leading-none mb-2">
              PRÉDICAS
            </Text>
            <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
              Metadata, listado y detalle preparados para enlazar contenido publicado.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-3xl bg-surface-container-low p-5"
            onPress={() => router.push('/(tabs)/content/pastoral-messages')}
            activeOpacity={0.86}
          >
            <Text className="font-humane text-4xl uppercase text-on-surface leading-none mb-2">
              MENSAJES
            </Text>
            <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
              Estructura lista para publicaciones pastorales en lista y detalle.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-3xl bg-surface-container-low p-5"
            onPress={() => router.push('/(tabs)/content/announcements')}
            activeOpacity={0.86}
          >
            <Text className="font-humane text-4xl uppercase text-on-surface leading-none mb-2">
              ANUNCIOS
            </Text>
            <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
              Noticias, eventos y anuncios listos para conectarse a Firestore.
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  )
}
