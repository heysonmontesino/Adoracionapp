import { useEffect, useMemo, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { useAuthStore } from '../../../../src/features/auth/store'
import { getPrayerRequest } from '../../../../src/features/community/prayer-requests/repository'
import { usePrayForRequest } from '../../../../src/features/community/prayer-requests/hooks/usePrayForRequest'
import type { PrayerRequest } from '../../../../src/features/community/prayer-requests/types'
import { Tokens } from '../../../../src/shared/constants/tokens'

type LocalComment = {
  id: string
  authorName: string
  body: string
  createdAt: string
}

function formatDate(timestamp: any): string {
  if (!timestamp) return 'Fecha no disponible'
  try {
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return 'Fecha no disponible'
  }
}

export default function PrayerRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'member'
  const [request, setRequest] = useState<PrayerRequest | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [comments, setComments] = useState<LocalComment[]>([])
  const [commentBody, setCommentBody] = useState('')
  const { mutate: pray, isPending: isPraying } = usePrayForRequest()

  const commentsKey = useMemo(() => `prayer-comments:${id}`, [id])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        const [requestData, rawComments] = await Promise.all([
          getPrayerRequest(id),
          AsyncStorage.getItem(commentsKey),
        ])
        if (!mounted) return
        setRequest(requestData)
        setComments(rawComments ? JSON.parse(rawComments) : [])
      } catch (error) {
        console.error('[PrayerRequestDetail] load failed', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [commentsKey, id])

  async function handleAddComment() {
    const body = commentBody.trim()
    if (!body) return

    const nextComment: LocalComment = {
      id: `${Date.now()}`,
      authorName: user?.displayName || 'Hermano/a',
      body,
      createdAt: new Date().toISOString(),
    }
    const nextComments = [...comments, nextComment]
    setComments(nextComments)
    setCommentBody('')
    await AsyncStorage.setItem(commentsKey, JSON.stringify(nextComments))
  }

  if (isLoading) {
    return (
      <Screen>
        <View style={{ padding: 24, gap: 16 }}>
          <Skeleton height={48} borderRadius={24} />
          <Skeleton height={280} borderRadius={32} />
          <Skeleton height={120} borderRadius={24} />
        </View>
      </Screen>
    )
  }

  if (!request) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <EmptyState title="Petición no encontrada" message="No pudimos cargar esta petición." actionLabel="Volver" onAction={() => router.back()} />
        </View>
      </Screen>
    )
  }

  const authorLabel = request.author.isAnonymous ? 'Petición anónima' : request.author.displayName ?? 'Hermano/a'

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 18 }}>
            <Ionicons name="chevron-back" size={24} color={Tokens.colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ borderRadius: 32, padding: 24, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ fontFamily: Tokens.typography.fontFamily.bold, fontSize: 11, color: Tokens.colors.primary, letterSpacing: 1.3, textTransform: 'uppercase' }}>
              Petición de oración
            </Text>
            <Text style={{ fontFamily: Tokens.typography.fontFamily.display, fontSize: 42, lineHeight: 40, color: Tokens.colors.textPrimary, marginTop: 10 }}>
              {request.title || 'Petición'}
            </Text>
            <Text style={{ fontFamily: Tokens.typography.fontFamily.regular, fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.78)', marginTop: 18 }}>
              {request.body}
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
              <View style={{ borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(15,223,223,0.09)' }}>
                <Text style={{ fontFamily: Tokens.typography.fontFamily.bold, fontSize: 11, color: Tokens.colors.primary }}>{authorLabel}</Text>
              </View>
              <View style={{ borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <Text style={{ fontFamily: Tokens.typography.fontFamily.medium, fontSize: 11, color: Tokens.colors.textSecondary }}>{formatDate(request.createdAt)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={{ marginTop: 22, height: 54, borderRadius: 18, backgroundColor: Tokens.colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: isPraying ? 0.7 : 1 }}
              disabled={isPraying || !user}
              onPress={() => {
                if (!user) return
                pray(
                  { requestId: request.id, userId: user.uid, role },
                  {
                    onSuccess: () => setRequest((prev) => prev ? { ...prev, prayerCount: prev.prayerCount + 1 } : prev),
                    onError: () => Alert.alert('No se pudo registrar', 'Intenta nuevamente en un momento.'),
                  },
                )
              }}
            >
              <Ionicons name="heart" size={17} color="#0D0B14" />
              <Text style={{ fontFamily: Tokens.typography.fontFamily.bold, fontSize: 12, color: '#0D0B14', letterSpacing: 1 }}>
                {request.prayerCount} ORACIONES
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 28 }}>
            <Text style={{ fontFamily: Tokens.typography.fontFamily.bold, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 6 }}>
              NOTAS PERSONALES (SOLO TÚ LAS VES)
            </Text>
            <Text style={{ fontFamily: Tokens.typography.fontFamily.bold, fontSize: 16, color: Tokens.colors.textPrimary, marginBottom: 12 }}>
              Mis notas
            </Text>
            {comments.length === 0 ? (
              <View style={{ borderRadius: 24, padding: 18, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
                <Text style={{ fontFamily: Tokens.typography.fontFamily.regular, fontSize: 14, lineHeight: 21, color: Tokens.colors.textSecondary }}>
                  Aún no tienes notas. Puedes escribir lo que Dios ponga en tu corazón mientras oras por esta petición.
                </Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={{ borderRadius: 22, padding: 16, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 10 }}>
                  <Text style={{ fontFamily: Tokens.typography.fontFamily.bold, fontSize: 12, color: Tokens.colors.primary }}>{comment.authorName}</Text>
                  <Text style={{ fontFamily: Tokens.typography.fontFamily.regular, fontSize: 14, lineHeight: 21, color: Tokens.colors.textPrimary, marginTop: 6 }}>{comment.body}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 16, backgroundColor: '#171426', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
          <TextInput
            value={commentBody}
            onChangeText={setCommentBody}
            placeholder="Escribe una nota personal..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            multiline
            style={{ flex: 1, maxHeight: 96, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', color: Tokens.colors.textPrimary, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Tokens.typography.fontFamily.regular }}
          />
          <TouchableOpacity onPress={handleAddComment} disabled={!commentBody.trim()} style={{ width: 48, height: 48, borderRadius: 18, backgroundColor: commentBody.trim() ? Tokens.colors.primary : 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="bookmark" size={18} color={commentBody.trim() ? '#0D0B14' : 'rgba(255,255,255,0.35)'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
