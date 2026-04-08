import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { useMessages } from '../../../../src/features/content/pastoral-messages/hooks/useMessages'

export default function PastoralMessagesScreen() {
  const router = useRouter()
  const { data: messages, isLoading, isError, refetch, isFetching } = useMessages()

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={44} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton height={150} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={150} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (isError || !messages) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar los mensajes"
            message="Intenta nuevamente cuando tengas una conexión estable."
            actionLabel="Reintentar"
            onAction={() => refetch()}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View>
          <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
            MENSAJES
          </Text>
          <Text className="font-jakarta-regular text-base text-on-surface/70">
            Espacio preparado para mensajes pastorales reales desde Firestore.
          </Text>
        </View>

        {messages.length === 0 ? (
          <EmptyState
            title="Aún no hay mensajes"
            message="Aquí aparecerán las publicaciones pastorales cuando estén listas."
            actionLabel={isFetching ? undefined : 'Actualizar'}
            onAction={isFetching ? undefined : () => refetch()}
          />
        ) : (
          messages.map((message) => (
            <TouchableOpacity
              key={message.id}
              className="rounded-3xl bg-surface-container-low p-5"
              onPress={() =>
                router.push(`/(tabs)/content/pastoral-messages/${message.id}`)
              }
              activeOpacity={0.86}
            >
              <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-2">
                {message.pastor}
              </Text>
              <Text className="font-jakarta-bold text-xl text-on-surface mb-3">
                {message.title}
              </Text>
              <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
                {message.body}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
