import { useState } from 'react'
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { useAuthStore } from '../../../../src/features/auth/store'
import { usePrayerRequests } from '../../../../src/features/community/prayer-requests/hooks/usePrayerRequests'
import { usePrayForRequest } from '../../../../src/features/community/prayer-requests/hooks/usePrayForRequest'
import {
  useMarkAsAnswered,
  useArchivePrayerRequest,
} from '../../../../src/features/community/prayer-requests/hooks/usePrayerRequestActions'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../../src/shared/constants/colors'
import type { PrayerRequest, PrayerRequestType } from '../../../../src/features/community/prayer-requests/types'

function formatDate(timestamp: any): string {
  if (!timestamp) return ''
  try {
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('es', { day: 'numeric', month: 'long' })
  } catch {
    return ''
  }
}

function PrayerRequestCard({
  request,
  onPray,
  isPraying,
  currentUserId,
  onOpenActions,
  onOpenDetail,
}: {
  request: PrayerRequest
  onPray: () => void
  isPraying: boolean
  currentUserId: string | undefined
  onOpenActions: (request: PrayerRequest) => void
  onOpenDetail: () => void
}) {
  const isAuthor = currentUserId === request.userId
  const authorLabel = request.author.isAnonymous ? 'Petición Anónima' : (request.author.displayName ?? 'Hermano/a')

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    active: { label: 'Activa', color: Colors.primary, bg: 'rgba(74, 218, 218, 0.1)', icon: 'time-outline' },
    answered: { label: '¡Testimonio!', color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.1)', icon: 'star' },
    archived: { label: 'Archivada', color: 'rgba(229, 223, 253, 0.4)', bg: 'rgba(229, 223, 253, 0.05)', icon: 'archive-outline' },
  }

  const config = statusConfig[request.status] ?? statusConfig.active

  return (
    <TouchableOpacity
      className="rounded-[32px] bg-surface-container-low p-6 mb-4 border-[0.5px] border-on-surface/5"
      activeOpacity={0.88}
      onPress={onOpenDetail}
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-surface-bright items-center justify-center">
            <Ionicons name={request.author.isAnonymous ? 'eye-off' : 'person'} size={14} color="white" />
          </View>
          <View>
            <Text className="font-jakarta-semibold text-xs text-on-surface/70">{authorLabel}</Text>
            <Text className="font-jakarta-bold text-[9px] text-primary uppercase tracking-tighter">{request.category}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="px-3 py-1 rounded-full flex-row items-center gap-1" style={{ backgroundColor: config.bg }}>
            <Ionicons name={config.icon} size={10} color={config.color} />
            <Text className="font-jakarta-bold text-[10px] uppercase" style={{ color: config.color }}>{config.label}</Text>
          </View>
          {/* 3-dot menu — only for author */}
          {isAuthor && (
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation()
                onOpenActions(request)
              }}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full bg-surface-bright items-center justify-center"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-vertical" size={14} color={Colors.onSurface60} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {request.title ? (
        <Text className="font-jakarta-bold text-xl text-on-surface mb-2 leading-tight">{request.title}</Text>
      ) : null}

      <Text className="font-jakarta-regular text-[15px] leading-6 text-on-surface/80 mb-6">{request.body}</Text>

      <View className="flex-row items-center justify-between pt-4 border-t border-on-surface/5">
        <View>
          <Text className="font-jakarta-medium text-[11px] text-on-surface/40 uppercase tracking-wide">{formatDate(request.createdAt)}</Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Ionicons name="heart" size={12} color={Colors.primary} />
            <Text className="font-jakarta-bold text-xs text-on-surface/60">{request.prayerCount} orando</Text>
          </View>
        </View>

        {!isAuthor && request.status === 'active' ? (
          <TouchableOpacity
            onPress={(event) => {
              event.stopPropagation()
              onPray()
            }}
            disabled={isPraying}
            activeOpacity={0.7}
            className="flex-row items-center gap-2 rounded-full px-5 py-3 bg-primary/10"
          >
            <Ionicons name={isPraying ? 'sync' : 'heart'} size={16} color={Colors.primary} />
            <Text className="font-jakarta-bold text-xs text-primary uppercase tracking-widest">{isPraying ? '...' : 'Orar'}</Text>
          </TouchableOpacity>
        ) : isAuthor ? (
          <View className="px-5 py-3">
            <Text className="font-jakarta-bold text-[10px] text-on-surface/30 uppercase tracking-widest">Tu petición</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

// ─── Action Sheet ─────────────────────────────────────────────────────────────

function RequestActionSheet({
  request,
  visible,
  onClose,
  onEdit,
  onMarkAnswered,
  onDelete,
  isMarkingAnswered,
  isDeleting,
}: {
  request: PrayerRequest | null
  visible: boolean
  onClose: () => void
  onEdit: () => void
  onMarkAnswered: () => void
  onDelete: () => void
  isMarkingAnswered: boolean
  isDeleting: boolean
}) {
  if (!request) return null
  const isActive = request.status === 'active'

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            backgroundColor: '#1C192F',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 48,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(229,223,253,0.15)' }} />
          </View>

          {/* Title */}
          <Text
            style={{
              fontFamily: 'PlusJakartaSans-Bold',
              fontSize: 11,
              color: 'rgba(229,223,253,0.4)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            {request.title ?? 'Tu petición'}
          </Text>

          {/* Actions */}
          {isActive && (
            <TouchableOpacity
              onPress={onEdit}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(229,223,253,0.06)',
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(74,218,218,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
              </View>
              <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: '#E5DFFD' }}>
                Editar petición
              </Text>
            </TouchableOpacity>
          )}

          {isActive && (
            <TouchableOpacity
              onPress={onMarkAnswered}
              disabled={isMarkingAnswered}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(229,223,253,0.06)',
                opacity: isMarkingAnswered ? 0.5 : 1,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(74,222,128,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#4ADE80" />
              </View>
              <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: '#E5DFFD' }}>
                {isMarkingAnswered ? 'Guardando...' : 'Marcar como respondida'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onDelete}
            disabled={isDeleting}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 16,
              opacity: isDeleting ? 0.5 : 1,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(248,113,113,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="trash-outline" size={16} color="#f87171" />
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: '#f87171' }}>
              {isDeleting ? 'Eliminando...' : 'Eliminar petición'}
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 8,
              paddingVertical: 16,
              alignItems: 'center',
              borderRadius: 20,
              backgroundColor: 'rgba(229,223,253,0.05)',
            }}
          >
            <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: 'rgba(229,223,253,0.5)', letterSpacing: 1 }}>
              CANCELAR
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PrayerRequestsScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'member'
  const isLeader = role !== 'member'

  const [activeTab, setActiveTab] = useState<PrayerRequestType>('community')
  const [actionRequest, setActionRequest] = useState<PrayerRequest | null>(null)

  const { data: requests, isLoading, isError, refetch } = usePrayerRequests(role, activeTab)
  const { mutate: pray, isPending: isPraying, variables: prayingVariables } = usePrayForRequest()
  const { mutate: markAnswered, isPending: isMarkingAnswered } = useMarkAsAnswered()
  const { mutate: archive, isPending: isArchiving } = useArchivePrayerRequest()

  function handleOpenActions(request: PrayerRequest) {
    setActionRequest(request)
  }

  function handleCloseActions() {
    setActionRequest(null)
  }

  function handleEdit() {
    if (!actionRequest) return
    handleCloseActions()
    router.push({ pathname: '/(tabs)/community/prayer-requests/edit', params: { id: actionRequest.id } })
  }

  function handleMarkAnswered() {
    if (!actionRequest) return
    markAnswered(actionRequest.id, {
      onSuccess: handleCloseActions,
    })
  }

  function handleDelete() {
    if (!actionRequest) return
    Alert.alert(
      'Eliminar petición',
      '¿Estás seguro de que quieres eliminar esta petición? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            archive(actionRequest.id, {
              onSuccess: handleCloseActions,
            })
          },
        },
      ],
    )
  }

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-12">
          <Skeleton height={60} borderRadius={30} style={{ marginBottom: 32 }} />
          <Skeleton height={200} borderRadius={32} style={{ marginBottom: 20 }} />
          <Skeleton height={200} borderRadius={32} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        <View className="mb-6">
          <Text className="font-humane text-6xl text-on-surface uppercase leading-none pt-2">ORACIONES</Text>
          <Text className="font-jakarta-regular text-base text-on-surface/60 mt-1">Sosteniéndonos los unos a los otros.</Text>
        </View>

        {/* Tab Selector - Only show for Leaders */}
        {isLeader && (
          <View className="flex-row bg-surface-container-low rounded-2xl p-1 mb-6">
            {(['community', 'pastoral'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                className={`flex-1 py-3 items-center rounded-xl ${activeTab === t ? 'bg-surface-bright' : ''}`}
              >
                <Text className={`font-jakarta-bold text-xs uppercase tracking-widest ${activeTab === t ? 'text-primary' : 'text-on-surface/40'}`}>
                  {t === 'community' ? 'Comunidad' : 'Pastoral'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/community/prayer-requests/create')}
          className="bg-primary rounded-3xl py-5 px-6 flex-row items-center justify-between mb-8 shadow-lg shadow-primary/20"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="add" size={24} color="white" />
            </View>
            <View>
              <Text className="font-jakarta-bold text-base text-white">Nueva petición</Text>
              <Text className="font-jakarta-regular text-xs text-white/80">Comparte tu necesidad</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

        {isError ? (
          <EmptyState
            title="Algo salió mal"
            message="No pudimos cargar las peticiones. Si acabas de actualizar la app, es posible que el sistema se esté sincronizando. Reintenta en un momento."
            actionLabel="Reintentar"
            onAction={refetch}
          />
        ) : !requests || requests.length === 0 ? (
          <EmptyState
            title="Círculo de Oración"
            message={activeTab === 'pastoral' ? 'No hay peticiones pastorales pendientes.' : 'Aún no hay peticiones activas. Comparte tu motivo con la hermandad.'}
          />
        ) : (
          requests.map((request) => (
            <PrayerRequestCard
              key={request.id}
              request={request}
              currentUserId={user?.uid}
              isPraying={isPraying && prayingVariables?.requestId === request.id}
              onPray={() => {
                if (!user) return
                pray(
                  { requestId: request.id, userId: user.uid, role },
                  {
                    onError: (err) => {
                      const msg = err instanceof Error ? err.message : String(err)
                      const isAlreadyPrayed = msg.toLowerCase().includes('already')
                      Alert.alert(
                        isAlreadyPrayed ? 'Ya oraste' : 'No se pudo registrar',
                        isAlreadyPrayed
                          ? 'Ya registraste tu oración por esta petición.'
                          : 'No pudimos registrar tu oración en este momento. Inténtalo nuevamente.'
                      )
                    },
                  }
                )
              }}
              onOpenActions={handleOpenActions}
              onOpenDetail={() => router.push(`/(tabs)/community/prayer-requests/${request.id}` as never)}
            />
          ))
        )}
      </ScrollView>

      <RequestActionSheet
        request={actionRequest}
        visible={actionRequest !== null}
        onClose={handleCloseActions}
        onEdit={handleEdit}
        onMarkAnswered={handleMarkAnswered}
        onDelete={handleDelete}
        isMarkingAnswered={isMarkingAnswered}
        isDeleting={isArchiving}
      />
    </Screen>
  )
}
