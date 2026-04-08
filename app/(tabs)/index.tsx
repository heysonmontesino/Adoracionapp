import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../src/shared/components/layout/Screen'
import { EmptyState } from '../../src/shared/components/feedback/EmptyState'
import { Skeleton } from '../../src/shared/components/feedback/Skeleton'
import { useHomeData } from '../../src/features/home/hooks/useHomeData'

function HomeSectionCard({
  eyebrow,
  title,
  body,
  onPress,
}: {
  eyebrow: string
  title: string
  body: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      className="rounded-3xl bg-surface-container-low p-5"
      onPress={onPress}
      activeOpacity={0.86}
    >
      <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-2">
        {eyebrow}
      </Text>
      <Text className="font-jakarta-bold text-xl text-on-surface mb-3">{title}</Text>
      <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
        {body}
      </Text>
    </TouchableOpacity>
  )
}

export default function HomeScreen() {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useHomeData()

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={54} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton height={150} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={150} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={150} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (isError || !data) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar el inicio"
            message="Intenta nuevamente para recuperar el contenido destacado."
            actionLabel="Reintentar"
            onAction={() => refetch()}
          />
        </View>
      </Screen>
    )
  }

  const { featuredSermon, latestMessage, pinnedAnnouncement } = data
  const hasAnyContent = Boolean(featuredSermon || latestMessage || pinnedAnnouncement)

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View>
          <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
            INICIO
          </Text>
          <Text className="font-jakarta-regular text-base text-on-surface/70">
            Contenido vivo desde Firestore para acompañar a la iglesia con enfoque
            pastoral.
          </Text>
        </View>

        {!hasAnyContent ? (
          <EmptyState
            title="Aún no hay destacados"
            message="Cuando se publiquen prédicas, mensajes y anuncios, aparecerán aquí."
            actionLabel="Ir a Contenido"
            onAction={() => router.push('/(tabs)/content')}
          />
        ) : (
          <>
            {featuredSermon ? (
              <HomeSectionCard
                eyebrow="Prédica destacada"
                title={featuredSermon.title}
                body={featuredSermon.description}
                onPress={() =>
                  router.push(`/(tabs)/content/sermons/${featuredSermon.id}`)
                }
              />
            ) : null}

            {latestMessage ? (
              <HomeSectionCard
                eyebrow="Último mensaje"
                title={latestMessage.title}
                body={latestMessage.body}
                onPress={() =>
                  router.push(
                    `/(tabs)/content/pastoral-messages/${latestMessage.id}`,
                  )
                }
              />
            ) : null}

            {pinnedAnnouncement ? (
              <HomeSectionCard
                eyebrow="Anuncio destacado"
                title={pinnedAnnouncement.title}
                body={pinnedAnnouncement.body}
                onPress={() => router.push('/(tabs)/content/announcements')}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}
