import { ScrollView, Text, View } from 'react-native'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { useAnnouncements } from '../../../../src/features/content/announcements/hooks/useAnnouncements'

export default function AnnouncementsScreen() {
  const { data: announcements, isLoading, isError, refetch, isFetching } =
    useAnnouncements()

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={44} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton height={140} borderRadius={24} style={{ marginBottom: 16 }} />
          <Skeleton height={140} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (isError || !announcements) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar los anuncios"
            message="Intenta nuevamente en unos momentos para recuperar la información."
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
            ANUNCIOS
          </Text>
          <Text className="font-jakarta-regular text-base text-on-surface/70">
            Tablero editorial listo para noticias, eventos y anuncios desde Firestore.
          </Text>
        </View>

        {announcements.length === 0 ? (
          <EmptyState
            title="Aún no hay anuncios"
            message="Las novedades de la iglesia aparecerán aquí cuando estén publicadas."
            actionLabel={isFetching ? undefined : 'Actualizar'}
            onAction={isFetching ? undefined : () => refetch()}
          />
        ) : (
          announcements.map((announcement) => (
            <View
              key={announcement.id}
              className="rounded-3xl bg-surface-container-low p-5"
            >
              <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-2">
                {announcement.type}
              </Text>
              <Text className="font-jakarta-bold text-xl text-on-surface mb-3">
                {announcement.title}
              </Text>
              <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/70 mb-4">
                {announcement.body}
              </Text>
              {announcement.ctaLabel ? (
                <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-on-surface/60">
                  CTA disponible: {announcement.ctaLabel}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  )
}
