import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { Button } from '../../../../src/shared/components/ui/Button'
import { useAuthStore } from '../../../../src/features/auth/store'
import { usePrayerRequests } from '../../../../src/features/community/prayer-requests/hooks/usePrayerRequests'
import { usePrayForRequest } from '../../../../src/features/community/prayer-requests/hooks/usePrayForRequest'
import type { PrayerRequest } from '../../../../src/features/community/prayer-requests/types'

function formatDate(timestamp: { toDate(): Date } | null | undefined): string {
  if (!timestamp) return ''
  try {
    return timestamp.toDate().toLocaleDateString('es', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return ''
  }
}

function PrayerRequestCard({
  request,
  onPray,
  isPraying,
}: {
  request: PrayerRequest
  onPray: () => void
  isPraying: boolean
}) {
  const authorLabel = request.anonymous ? 'Anónimo' : (request.displayName ?? 'Hermano/a')
  const statusColors: Record<string, string> = {
    active: 'text-primary',
    answered: 'text-green-400',
    archived: 'text-on-surface/40',
  }

  return (
    <View className="rounded-3xl bg-surface-container-low p-5">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-on-surface/60">
          {authorLabel}
        </Text>
        <Text className={`font-jakarta-medium text-xs uppercase tracking-[1px] ${statusColors[request.status]}`}>
          {request.status === 'active' ? 'Activa' : request.status === 'answered' ? 'Respondida' : 'Archivada'}
        </Text>
      </View>

      {request.title ? (
        <Text className="font-jakarta-bold text-lg text-on-surface mb-2">
          {request.title}
        </Text>
      ) : null}

      <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/80 mb-4" numberOfLines={4}>
        {request.body}
      </Text>

      <View className="flex-row items-center justify-between">
        <Text className="font-jakarta-regular text-xs text-on-surface/50">
          {formatDate(request.createdAt)} · {request.prayerCount}{' '}
          {request.prayerCount === 1 ? 'oración' : 'oraciones'}
        </Text>
        {request.status === 'active' ? (
          <TouchableOpacity
            onPress={onPray}
            disabled={isPraying}
            activeOpacity={0.7}
            className="bg-surface-bright rounded-full px-4 py-2"
          >
            <Text className="font-jakarta-bold text-xs text-primary uppercase tracking-[1px]">
              {isPraying ? 'Orando...' : 'Orar'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}

export default function PrayerRequestsScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'member'

  const { data: requests, isLoading, isError, refetch, isFetching } = usePrayerRequests(role)
  const { mutate: pray, isPending: isPraying, variables: prayingVariables } = usePrayForRequest()

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={44} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton height={160} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={160} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={160} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (isError || !requests) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar las peticiones"
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
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100, gap: 16 }}>
        <View className="flex-row items-end justify-between mb-2">
          <View className="flex-1 mr-4">
            <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
              ORACIONES
            </Text>
            <Text className="font-jakarta-regular text-sm text-on-surface/60">
              Ora con tu comunidad. Cada petición es recibida con reverencia.
            </Text>
          </View>
        </View>

        <Button
          label="Nueva petición"
          variant="secondary"
          onPress={() => router.push('/(tabs)/community/prayer-requests/create')}
        />

        {requests.length === 0 ? (
          <EmptyState
            title="Aún no hay peticiones"
            message="Sé el primero en compartir una petición de oración con la comunidad."
          />
        ) : (
          requests.map((request) => (
            <PrayerRequestCard
              key={request.id}
              request={request}
              isPraying={isPraying && prayingVariables?.requestId === request.id}
              onPray={() => {
                if (!user) return
                pray({ requestId: request.id, userId: user.uid, role })
              }}
            />
          ))
        )}

        {requests.length > 0 && (
          <Button
            label={isFetching ? 'Actualizando...' : 'Actualizar'}
            variant="ghost"
            isLoading={isFetching}
            onPress={() => refetch()}
          />
        )}
      </ScrollView>
    </Screen>
  )
}
