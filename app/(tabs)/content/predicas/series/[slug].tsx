import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen } from '../../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../../src/shared/components/feedback/EmptyState'
import { useSeriesDetail, useSeriesEpisodes } from '../../../../../src/features/content/videos/hooks/useSeries'

export default function SeriesDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ slug?: string }>()
  const slug = typeof params.slug === 'string' ? params.slug : ''

  const { data: series, isLoading: seriesLoading } = useSeriesDetail(slug)
  const {
    data: episodes,
    isLoading: episodesLoading,
    isError,
    refetch,
  } = useSeriesEpisodes(slug)

  const isLoading = seriesLoading || episodesLoading

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

  if (isError || !episodes) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar los episodios"
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
        {/* Series header */}
        <View>
          <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-2">
            SERIE · {episodes.length} EPISODIOS
          </Text>
          <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
            {series?.name ?? slug.toUpperCase()}
          </Text>
          {series?.description && (
            <Text className="font-jakarta-regular text-base text-on-surface/70">
              {series.description}
            </Text>
          )}
        </View>

        {/* Episode list */}
        {episodes.length === 0 ? (
          <EmptyState title="Sin episodios" message="Esta serie aún no tiene episodios disponibles." />
        ) : (
          episodes.map((episode) => (
            <TouchableOpacity
              key={episode.id}
              className="rounded-3xl bg-surface-container-low p-5"
              onPress={() => router.push(`/(tabs)/content/predicas/${episode.id}`)}
              activeOpacity={0.86}
            >
              <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-2">
                {episode.episodeNumber !== null ? `EP. ${episode.episodeNumber}` : ''}
                {episode.preacherName ? ` · ${episode.preacherName}` : ''}
              </Text>
              <Text className="font-jakarta-bold text-xl text-on-surface leading-tight mb-1">
                {episode.title}
              </Text>
              <Text className="font-jakarta-regular text-xs text-on-surface/60 uppercase tracking-[1px]">
                {episode.duration}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
