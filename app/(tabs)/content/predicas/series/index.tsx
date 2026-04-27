import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../../src/shared/components/feedback/EmptyState'
import { useAllSeries } from '../../../../../src/features/content/videos/hooks/useSeries'

export default function SeriesListScreen() {
  const router = useRouter()
  const { data: series, isLoading, isError, refetch } = useAllSeries()

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={44} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton height={100} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={100} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={100} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (isError) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar las series"
            message="Revisa tu conexión o intenta nuevamente."
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
        <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
          SERIES
        </Text>

        {!series || series.length === 0 ? (
          <EmptyState
            title="Aún no hay series"
            message="Las series aparecerán aquí cuando el canal esté sincronizado."
          />
        ) : (
          series.map((s) => (
            <TouchableOpacity
              key={s.slug}
              className="rounded-3xl bg-surface-container-low p-5"
              onPress={() => router.push(`/(tabs)/content/predicas/series/${s.slug}`)}
              activeOpacity={0.86}
            >
              <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-2">
                {s.episodeCount} EPISODIOS
              </Text>
              <Text className="font-humane text-4xl text-on-surface uppercase leading-none">
                {s.name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
