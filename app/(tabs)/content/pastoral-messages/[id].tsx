import { ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { useMessage } from '../../../../src/features/content/pastoral-messages/hooks/useMessage'

export default function PastoralMessageDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const messageId = typeof params.id === 'string' ? params.id : ''
  const { data: message, isLoading, isError, refetch } = useMessage(messageId)

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={36} borderRadius={18} style={{ marginBottom: 14 }} />
          <Skeleton height={22} borderRadius={10} style={{ marginBottom: 16 }} />
          <Skeleton height={180} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (isError || !message) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No encontramos este mensaje"
            message="Puede que todavía no esté disponible o haya sido retirado."
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
          {message.pastor}
        </Text>
        <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-5">
          {message.title}
        </Text>
        <Text className="font-jakarta-regular text-base leading-8 text-on-surface/75">
          {message.body}
        </Text>
      </ScrollView>
    </Screen>
  )
}
