import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Skeleton } from '../../../../src/shared/components/feedback/Skeleton'
import { EmptyState } from '../../../../src/shared/components/feedback/EmptyState'
import { Colors } from '../../../../src/shared/constants/colors'
import { useAuthStore } from '../../../../src/features/auth/store'
import { useChannelPosts } from '../../../../src/features/community/channels/hooks/useChannelPosts'
import { useCreatePost } from '../../../../src/features/community/channels/hooks/useCreatePost'
import type { ChannelPost } from '../../../../src/features/community/channels/types'

function formatRelativeDate(timestamp: { toDate(): Date } | null | undefined): string {
  if (!timestamp) return ''
  try {
    const date = timestamp.toDate()
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHrs = diffMs / (1000 * 60 * 60)
    if (diffHrs < 1) return 'hace unos minutos'
    if (diffHrs < 24) return `hace ${Math.floor(diffHrs)}h`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays === 1) return 'ayer'
    if (diffDays < 7) return `hace ${diffDays} días`
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

function PostCard({ post }: { post: ChannelPost }) {
  const initials = post.displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <View className="flex-row gap-3 py-4 border-b border-surface-bright">
      <View className="w-10 h-10 rounded-full bg-surface-bright items-center justify-center flex-shrink-0">
        <Text className="font-jakarta-bold text-sm text-on-surface">
          {initials || '?'}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="font-jakarta-bold text-sm text-on-surface">
            {post.displayName}
          </Text>
          <Text className="font-jakarta-regular text-xs text-on-surface/40">
            {formatRelativeDate(post.createdAt)}
          </Text>
        </View>
        {post.title ? (
          <Text className="font-jakarta-bold text-base text-on-surface mb-1">
            {post.title}
          </Text>
        ) : null}
        <Text className="font-jakarta-regular text-sm leading-6 text-on-surface/80">
          {post.body}
        </Text>
      </View>
    </View>
  )
}

export default function ChannelPostsScreen() {
  const { id: channelId } = useLocalSearchParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)

  const { data: posts, isLoading, isError, refetch } = useChannelPosts(channelId)
  const { mutate: createPost, isPending } = useCreatePost()

  const [body, setBody] = useState('')

  function handleSend() {
    if (!user || !body.trim() || isPending) return

    createPost(
      {
        channelId,
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        input: { body: body.trim() },
      },
      {
        onSuccess: () => setBody(''),
        onError: () =>
          Alert.alert('Error', 'No se pudo enviar el mensaje. Intenta nuevamente.'),
      },
    )
  }

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 px-6 pt-8">
          <Skeleton height={44} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton height={80} borderRadius={16} style={{ marginBottom: 12 }} />
          <Skeleton height={80} borderRadius={16} style={{ marginBottom: 12 }} />
          <Skeleton height={80} borderRadius={16} />
        </View>
      </Screen>
    )
  }

  if (isError || !posts) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <EmptyState
            title="No pudimos cargar los mensajes"
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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 16 }}
        >
          {posts.length === 0 ? (
            <EmptyState
              title="Aún no hay publicaciones"
              message="Sé el primero en publicar en este canal."
            />
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </ScrollView>

        {/* Compose bar */}
        <View className="flex-row items-end gap-3 px-6 py-4 bg-surface-container-low">
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={Colors.onSurface40}
            className="flex-1 rounded-2xl bg-surface-bright px-4 py-3 font-jakarta-regular text-sm text-on-surface"
            multiline
            maxLength={500}
            style={{ maxHeight: 100 }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!body.trim() || isPending}
            activeOpacity={0.7}
            className={`rounded-full px-4 py-3 ${
              body.trim() && !isPending ? 'bg-primary' : 'bg-surface-bright'
            }`}
          >
            <Text
              className={`font-jakarta-bold text-sm ${
                body.trim() && !isPending ? 'text-background' : 'text-on-surface/40'
              }`}
            >
              {isPending ? '...' : 'Enviar'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
