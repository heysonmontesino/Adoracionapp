import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { useLiveStream } from '../../../../src/features/content/videos/hooks/useLiveStream'
import { useLatestSermons, useFeaturedVideo } from '../../../../src/features/content/videos/hooks/useVideos'
import { useAllSeries } from '../../../../src/features/content/videos/hooks/useSeries'

function LiveBanner({ videoUrl, title }: { videoUrl: string; title: string }) {
  return (
    <TouchableOpacity
      className="rounded-3xl bg-primary/20 border border-primary/40 p-5 mb-6"
      onPress={() => Linking.openURL(videoUrl)}
      activeOpacity={0.86}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-2 h-2 rounded-full bg-primary" />
        <Text className="font-jakarta-bold text-xs uppercase tracking-[2px] text-primary">
          EN VIVO AHORA
        </Text>
      </View>
      <Text className="font-humane text-4xl text-on-surface uppercase leading-none">
        {title}
      </Text>
      <Text className="font-jakarta-medium text-sm text-primary mt-3">
        Ver transmisión →
      </Text>
    </TouchableOpacity>
  )
}

function SermonCard({
  id,
  title,
  preacherName,
  seriesName,
  episodeNumber,
  duration,
  onPress,
}: {
  id: string
  title: string
  preacherName: string | null
  seriesName: string | null
  episodeNumber: number | null
  duration: string
  onPress: () => void
}) {
  const meta = [
    preacherName,
    seriesName && episodeNumber !== null ? `${seriesName} · Ep. ${episodeNumber}` : seriesName,
    duration,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <TouchableOpacity
      className="rounded-3xl bg-surface-container-low p-5"
      onPress={onPress}
      activeOpacity={0.86}
    >
      <Text className="font-jakarta-bold text-xl text-on-surface mb-2 leading-tight">
        {title}
      </Text>
      {meta.length > 0 && (
        <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-on-surface/60">
          {meta}
        </Text>
      )}
    </TouchableOpacity>
  )
}

export default function PredicasScreen() {
  const router = useRouter()
  const { data: live } = useLiveStream()
  const { data: featured } = useFeaturedVideo()
  const { data: sermons, isLoading: sermonsLoading, isError: sermonsError, refetch } = useLatestSermons(10)
  const { data: allSeries, isLoading: seriesLoading } = useAllSeries()

  const isLoading = sermonsLoading || seriesLoading

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={44} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton height={120} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={100} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={100} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (sermonsError) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar el contenido"
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
        {/* Header */}
        <View>
          <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
            PRÉDICAS
          </Text>
          <Text className="font-jakarta-regular text-base text-on-surface/70">
            Mensajes de Iglesia Adoración Colombia
          </Text>
        </View>

        {/* Live banner (shown only when there is an active stream) */}
        {live && <LiveBanner videoUrl={live.videoUrl} title={live.title} />}

        {/* Series shortcut */}
        {allSeries && allSeries.length > 0 && (
          <TouchableOpacity
            className="rounded-3xl bg-surface-container-low p-5"
            onPress={() => router.push('/(tabs)/content/predicas/series')}
            activeOpacity={0.86}
          >
            <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-2">
              {allSeries.length} SERIES
            </Text>
            <Text className="font-humane text-4xl text-on-surface uppercase leading-none">
              VER TODAS LAS SERIES
            </Text>
          </TouchableOpacity>
        )}

        {/* Featured sermon */}
        {featured && !live && (
          <View>
            <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-3">
              DESTACADO
            </Text>
            <SermonCard
              id={featured.id}
              title={featured.title}
              preacherName={featured.preacherName}
              seriesName={featured.seriesName}
              episodeNumber={featured.episodeNumber}
              duration={featured.duration}
              onPress={() => router.push(`/(tabs)/content/predicas/${featured.id}`)}
            />
          </View>
        )}

        {/* Latest sermons */}
        {sermons && sermons.length > 0 && (
          <View className="gap-3">
            <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary">
              ÚLTIMAS PRÉDICAS
            </Text>
            {sermons.map((sermon) => (
              <SermonCard
                key={sermon.id}
                id={sermon.id}
                title={sermon.title}
                preacherName={sermon.preacherName}
                seriesName={sermon.seriesName}
                episodeNumber={sermon.episodeNumber}
                duration={sermon.duration}
                onPress={() => router.push(`/(tabs)/content/predicas/${sermon.id}`)}
              />
            ))}
          </View>
        )}

        {(!sermons || sermons.length === 0) && !live && (
          <EmptyState
            title="Aún no hay prédicas"
            message="Cuando se sincronice el canal de YouTube, el contenido aparecerá aquí."
          />
        )}
      </ScrollView>
    </Screen>
  )
}
