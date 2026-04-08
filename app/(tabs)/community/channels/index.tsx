import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { useAuthStore } from '../../../../src/features/auth/store'
import { useChannels } from '../../../../src/features/community/channels/hooks/useChannels'
import type { Channel } from '../../../../src/features/community/channels/types'

const CHANNEL_TYPE_LABELS: Record<string, string> = {
  public: 'General',
  leaders: 'Líderes',
  pastors: 'Pastores',
}

function ChannelCard({ channel, onPress }: { channel: Channel; onPress: () => void }) {
  return (
    <TouchableOpacity
      className="rounded-3xl bg-surface-container-low p-5"
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-jakarta-bold text-lg text-on-surface flex-1 mr-3">
          {channel.name}
        </Text>
        <View className="rounded-full bg-surface-bright px-3 py-1">
          <Text className="font-jakarta-medium text-xs text-on-surface/60 uppercase tracking-[1px]">
            {CHANNEL_TYPE_LABELS[channel.type] ?? channel.type}
          </Text>
        </View>
      </View>
      <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70">
        {channel.description}
      </Text>
    </TouchableOpacity>
  )
}

export default function ChannelsScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'member'

  const { data: channels, isLoading, isError, refetch } = useChannels(role)

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={44} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton height={110} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={110} borderRadius={24} style={{ marginBottom: 16 }} />
        </View>
      </Screen>
    )
  }

  if (isError || !channels) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar los canales"
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
        <View className="mb-2">
          <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
            CANALES
          </Text>
          <Text className="font-jakarta-regular text-sm text-on-surface/60">
            Mensajes y comunicaciones del liderazgo de la iglesia.
          </Text>
        </View>

        {channels.length === 0 ? (
          <EmptyState
            title="Aún no hay canales"
            message="El liderazgo publicará canales de comunicación próximamente."
          />
        ) : (
          channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onPress={() =>
                router.push(`/(tabs)/community/channels/${channel.id}` as never)
              }
            />
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
