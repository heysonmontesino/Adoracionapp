import { useState } from 'react'
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Button } from '../../../../src/shared/components/ui/Button'
import { Colors } from '../../../../src/shared/constants/colors'
import { useAuthStore } from '../../../../src/features/auth/store'
import { useCreatePrayerRequest } from '../../../../src/features/community/prayer-requests/hooks/useCreatePrayerRequest'
import type { PrayerRequestVisibility } from '../../../../src/features/community/prayer-requests/types'

export default function CreatePrayerRequestScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'member'

  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [visibility, setVisibility] = useState<PrayerRequestVisibility>('public')

  const { mutate: create, isPending } = useCreatePrayerRequest()

  const isLeaderOrAbove = role === 'leader' || role === 'pastor' || role === 'admin'
  const canSubmit = body.trim().length >= 10

  function handleSubmit() {
    if (!user || !canSubmit) return

    create(
      {
        userId: user.uid,
        displayName: user.displayName,
        role,
        input: {
          body: body.trim(),
          title: title.trim() || undefined,
          anonymous,
          visibility,
        },
      },
      {
        onSuccess: () => {
          router.back()
        },
        onError: () => {
          Alert.alert('Error', 'No se pudo enviar la petición. Intenta nuevamente.')
        },
      },
    )
  }

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, gap: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text className="font-humane text-5xl text-on-surface uppercase leading-none mb-2">
            NUEVA PETICIÓN
          </Text>
          <Text className="font-jakarta-regular text-sm text-on-surface/60">
            Tu petición será recibida con cuidado y oración por la comunidad.
          </Text>
        </View>

        {/* Title (optional) */}
        <View>
          <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-on-surface/60 mb-2">
            Título (opcional)
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Por la salud de mi madre"
            placeholderTextColor={Colors.onSurface40}
            className="rounded-2xl bg-surface-container-low px-4 py-4 font-jakarta-regular text-base text-on-surface"
            maxLength={80}
          />
        </View>

        {/* Body (required) */}
        <View>
          <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-on-surface/60 mb-2">
            Petición <Text className="text-primary">*</Text>
          </Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Comparte tu petición de oración con la comunidad..."
            placeholderTextColor={Colors.onSurface40}
            className="rounded-2xl bg-surface-container-low px-4 py-4 font-jakarta-regular text-base text-on-surface"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
            style={{ minHeight: 120 }}
          />
          <Text className="font-jakarta-regular text-xs text-on-surface/40 mt-1 text-right">
            {body.length}/1000
          </Text>
        </View>

        {/* Anonymous toggle */}
        <View className="flex-row items-center justify-between rounded-2xl bg-surface-container-low px-5 py-4">
          <View className="flex-1 mr-4">
            <Text className="font-jakarta-medium text-sm text-on-surface mb-1">
              Compartir anónimamente
            </Text>
            <Text className="font-jakarta-regular text-xs text-on-surface/60">
              Tu nombre no será visible para la comunidad
            </Text>
          </View>
          <Switch
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={{ false: Colors.surfaceBright, true: Colors.primary }}
            thumbColor={Colors.onSurface}
          />
        </View>

        {/* Visibility selector — only shown to leaders and above */}
        {isLeaderOrAbove ? (
          <View>
            <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-on-surface/60 mb-3">
              Visibilidad
            </Text>
            <View className="flex-row gap-3">
              {(['public', 'leaders_only'] as PrayerRequestVisibility[]).map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setVisibility(v)}
                  className={`flex-1 rounded-2xl px-4 py-3 items-center ${
                    visibility === v ? 'bg-primary' : 'bg-surface-container-low'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`font-jakarta-bold text-sm ${
                      visibility === v ? 'text-background' : 'text-on-surface/60'
                    }`}
                  >
                    {v === 'public' ? 'Pública' : 'Solo líderes'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <Button
          label="Enviar petición"
          onPress={handleSubmit}
          isLoading={isPending}
          disabled={!canSubmit}
        />

        <Button
          label="Cancelar"
          variant="ghost"
          onPress={() => router.back()}
          disabled={isPending}
        />
      </ScrollView>
    </Screen>
  )
}
