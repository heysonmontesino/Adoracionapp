import { Linking, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { Button } from '../../../../src/shared/components/ui/Button'
import { useSermon } from '../../../../src/features/content/sermons/hooks/useSermon'

export default function SermonDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const sermonId = typeof params.id === 'string' ? params.id : ''
  const { data: sermon, isLoading, isError, refetch } = useSermon(sermonId)

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={40} borderRadius={18} style={{ marginBottom: 16 }} />
          <Skeleton height={180} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={24} borderRadius={12} style={{ marginBottom: 12 }} />
          <Skeleton height={120} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (isError || !sermon) {
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
        <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-3">
          {sermon.pastor}
        </Text>
        <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-4">
          {sermon.title}
        </Text>
        <Text className="font-jakarta-regular text-base leading-7 text-on-surface/70 mb-6">
          {sermon.description}
        </Text>
        <View className="rounded-3xl bg-surface-container-low p-5 mb-6">
          <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-2">
            Metadata
          </Text>
          <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
            Duración: {sermon.duration}
          </Text>
          <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
            Serie: {sermon.series ?? 'Sin serie'}
          </Text>
          <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
            Fuente: YouTube por metadata y enlace
          </Text>
        </View>
        <Button
          label="Ver en YouTube"
          onPress={() => Linking.openURL(sermon.youtubeURL)}
        />
      </ScrollView>
    </Screen>
  )
}
