import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { Button } from '../../../../src/shared/components/ui/Button'
import { useVideo } from '../../../../src/features/content/videos/hooks/useVideos'

export default function VideoDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ id?: string }>()
  const videoId = typeof params.id === 'string' ? params.id : ''
  const { data: video, isLoading, isError, refetch } = useVideo(videoId)

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={40} borderRadius={18} style={{ marginBottom: 16 }} />
          <Skeleton height={200} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={24} borderRadius={12} style={{ marginBottom: 12 }} />
          <Skeleton height={120} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (isError || !video) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No encontramos esta prédica"
            message="El contenido puede haber cambiado o aún no estar disponible."
            actionLabel="Reintentar"
            onAction={() => refetch()}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* Preacher label */}
        {video.preacherName && (
          <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-3">
            {video.preacherName}
          </Text>
        )}

        {/* Title */}
        <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-4">
          {video.title}
        </Text>

        {/* Series badge */}
        {video.seriesName && (
          <TouchableOpacity
            className="self-start rounded-full bg-primary/20 px-4 py-2 mb-4"
            onPress={() => router.push(`/(tabs)/content/predicas/series/${video.seriesSlug}`)}
            activeOpacity={0.86}
          >
            <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary">
              {video.seriesName}
              {video.episodeNumber !== null ? ` · Ep. ${video.episodeNumber}` : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* Description */}
        {video.description.length > 0 && (
          <Text className="font-jakarta-regular text-base leading-7 text-on-surface/70 mb-6">
            {video.description}
          </Text>
        )}

        {/* Metadata card */}
        <View className="rounded-3xl bg-surface-container-low p-5 mb-6">
          <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-3">
            Información
          </Text>
          <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
            Duración: {video.duration}
          </Text>
          {video.internalOrder !== null && (
            <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
              Mensaje #{video.internalOrder}
            </Text>
          )}
          <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
            Fuente: YouTube · Iglesia Adoración Colombia
          </Text>
        </View>

        <Button
          label="Ver en YouTube"
          onPress={() => Linking.openURL(video.videoUrl)}
        />
      </ScrollView>
    </Screen>
  )
}
