import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { useChurchServices } from '../../../../src/features/community/services/hooks/useChurchServices'
import type { ChurchService } from '../../../../src/features/community/services/types'

function ServiceCard({ service }: { service: ChurchService }) {
  return (
    <View className="rounded-3xl bg-surface-container-low p-5">
      <Text className="font-jakarta-bold text-xl text-on-surface mb-1">
        {service.name}
      </Text>
      <Text className="font-jakarta-medium text-sm text-primary mb-3">
        {service.schedule}
      </Text>
      <Text className="font-jakarta-regular text-sm text-on-surface/70 mb-1">
        {service.location}
      </Text>
      {service.address ? (
        <Text className="font-jakarta-regular text-xs text-on-surface/50 mb-4">
          {service.address}
        </Text>
      ) : null}

      {service.mapsURL ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(service.mapsURL!)}
          activeOpacity={0.7}
          className="rounded-full bg-surface-bright px-4 py-2 self-start"
        >
          <Text className="font-jakarta-bold text-xs text-primary uppercase tracking-[1px]">
            Ver en mapa
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export default function ChurchServicesScreen() {
  const { data: services, isLoading, isError, refetch } = useChurchServices()

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={44} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton height={130} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={130} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (isError || !services) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar los servicios"
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
            SERVICIOS
          </Text>
          <Text className="font-jakarta-regular text-sm text-on-surface/60">
            Horarios y ubicaciones de los cultos de la iglesia.
          </Text>
        </View>

        {services.length === 0 ? (
          <EmptyState
            title="Horarios próximamente"
            message="El liderazgo publicará los horarios de servicio aquí."
          />
        ) : (
          services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
