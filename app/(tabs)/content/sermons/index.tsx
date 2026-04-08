import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { useSermons } from '../../../../src/features/content/sermons/hooks/useSermons'

export default function SermonsScreen() {
  const router = useRouter()
  const { data: sermons, isLoading, isError, refetch, isFetching } = useSermons()

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={44} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton height={140} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={140} borderRadius={24} style={{ marginBottom: 16 }} />
        </View>
      </Screen>
    )
  }

  if (isError || !sermons) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar las prédicas"
            message="Revisa tu conexión o intenta nuevamente en unos momentos."
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
            PRÉDICAS
          </Text>
          <Text className="font-jakarta-regular text-base text-on-surface/70">
            Biblioteca espiritual preparada para conectar contenido real desde
            Firestore.
          </Text>
        </View>

        {sermons.length === 0 ? (
          <EmptyState
            title="Aún no hay prédicas"
            message="Cuando liderazgo publique contenido, aparecerá aquí."
            actionLabel={isFetching ? undefined : 'Actualizar'}
            onAction={isFetching ? undefined : () => refetch()}
          />
        ) : (
          sermons.map((sermon) => (
            <TouchableOpacity
              key={sermon.id}
              className="rounded-3xl bg-surface-container-low p-5"
              onPress={() => router.push(`/(tabs)/content/sermons/${sermon.id}`)}
              activeOpacity={0.86}
            >
              <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-2">
                {sermon.pastor}
              </Text>
              <Text className="font-jakarta-bold text-xl text-on-surface mb-2">
                {sermon.title}
              </Text>
              <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70 mb-4">
                {sermon.description}
              </Text>
              <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-on-surface/60">
                {sermon.duration} {sermon.series ? `• ${sermon.series}` : ''}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
