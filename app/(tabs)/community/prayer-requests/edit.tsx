import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Button } from '../../../../src/shared/components/ui/Button'
import { Colors } from '../../../../src/shared/constants/colors'
import { useAuthStore } from '../../../../src/features/auth/store'
import { getPrayerRequest } from '../../../../src/features/community/prayer-requests/repository'
import { useUpdatePrayerRequest } from '../../../../src/features/community/prayer-requests/hooks/usePrayerRequestActions'
import { Ionicons } from '@expo/vector-icons'
import type { PrayerRequestCategory } from '../../../../src/features/community/prayer-requests/types'

const CATEGORIES: { label: string; value: PrayerRequestCategory }[] = [
  { label: 'General', value: 'general' },
  { label: 'Salud', value: 'salud' },
  { label: 'Familia', value: 'familia' },
  { label: 'Finanzas', value: 'finanzas' },
  { label: 'Otros', value: 'otros' },
]

export default function EditPrayerRequestScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)

  const { data: request, isLoading } = useQuery({
    queryKey: ['prayer-request', id],
    queryFn: () => getPrayerRequest(id),
    enabled: !!id,
  })

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<PrayerRequestCategory>('general')
  const [anonymous, setAnonymous] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Pre-fill form once data loads
  useEffect(() => {
    if (!request) return
    setTitle(request.title ?? '')
    setBody(request.body)
    setCategory(request.category)
    setAnonymous(request.author.isAnonymous)
  }, [request])

  const { mutateAsync: updateAsync, isPending } = useUpdatePrayerRequest()

  // Guard: only author can reach this screen
  useEffect(() => {
    if (!isLoading && request && user && request.userId !== user.uid) {
      router.back()
    }
  }, [isLoading, request, user, router])

  const bodyLength = body.trim().length
  const canSubmit = bodyLength >= 10

  async function handleSave() {
    if (!user || !request || !id) return
    if (!canSubmit) {
      setSubmitError(`Necesitas al menos 10 caracteres. Tienes ${bodyLength}.`)
      return
    }

    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      await updateAsync({
        requestId: id,
        displayName: user.displayName ?? null,
        input: {
          title: title.trim() || null,
          body: body.trim(),
          category,
          anonymous,
        },
      })
      setSubmitSuccess(true)
      setTimeout(() => router.back(), 800)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setSubmitError(`No pudimos guardar los cambios:\n${msg}`)
    }
  }

  if (isLoading || !request) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="font-jakarta-regular text-sm text-on-surface/40">Cargando...</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, gap: 28, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View>
            <View className="flex-row items-center gap-3 mb-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-surface-bright items-center justify-center"
              >
                <Ionicons name="arrow-back" size={20} color="white" />
              </TouchableOpacity>
              <Text className="font-humane text-6xl text-on-surface uppercase leading-none pt-2">
                EDITAR
              </Text>
            </View>
            <Text className="font-jakarta-regular text-base text-on-surface/60 leading-relaxed">
              Actualiza el contenido de tu petición.
            </Text>
          </View>

          {/* Category Selector */}
          <View>
            <Text className="font-jakarta-bold text-xs uppercase tracking-[1.5px] text-primary mb-3">
              Categoría
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  className={`px-5 py-3 rounded-full border ${
                    category === cat.value
                      ? 'bg-primary border-primary'
                      : 'bg-surface-container-low border-on-surface/5'
                  }`}
                >
                  <Text
                    className={`font-jakarta-bold text-xs ${
                      category === cat.value ? 'text-black' : 'text-on-surface/60'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title and Body */}
          <View className="gap-4">
            <View>
              <Text className="font-jakarta-bold text-xs uppercase tracking-[1.5px] text-primary mb-3">
                Título
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: Por la salud de mi familia"
                placeholderTextColor={Colors.onSurface40}
                className="rounded-2xl bg-surface-container-low px-5 py-4 font-jakarta-medium text-base text-on-surface border border-on-surface/5"
                maxLength={80}
              />
            </View>
            <View>
              <Text className="font-jakarta-bold text-xs uppercase tracking-[1.5px] text-primary mb-3">
                Detalles de la petición *
              </Text>
              <TextInput
                value={body}
                onChangeText={(t) => {
                  setBody(t)
                  if (submitError) setSubmitError(null)
                }}
                placeholder="Comparte lo que está en tu corazón..."
                placeholderTextColor={Colors.onSurface40}
                className="rounded-3xl bg-surface-container-low px-5 py-5 font-jakarta-regular text-base text-on-surface border border-on-surface/5"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={1000}
                style={{ minHeight: 140 }}
              />
              <View className="flex-row justify-end mt-2 px-1">
                <Text className="font-jakarta-medium text-[10px] text-on-surface/40">
                  {body.length} / 1000
                </Text>
              </View>
            </View>
          </View>

          {/* Anonymity */}
          <View className="rounded-3xl bg-surface-container-low p-5 border border-on-surface/5 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="eye-off-outline" size={16} color={Colors.primary} />
                <Text className="font-jakarta-bold text-sm text-on-surface">
                  Publicar sin mi nombre
                </Text>
              </View>
              <Text className="font-jakarta-regular text-xs text-on-surface/60 leading-5">
                Tu nombre no será visible para la comunidad.
              </Text>
            </View>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{ false: Colors.surfaceBright, true: Colors.primary }}
              thumbColor="white"
            />
          </View>

          <View className="mt-4 gap-3">
            {bodyLength > 0 && !canSubmit && (
              <View className="flex-row items-center gap-2 px-1">
                <Ionicons name="alert-circle-outline" size={14} color="#f87171" />
                <Text className="font-jakarta-medium text-xs" style={{ color: '#f87171' }}>
                  Necesitas al menos 10 caracteres ({bodyLength}/10)
                </Text>
              </View>
            )}
            {submitSuccess && (
              <View
                className="rounded-2xl px-4 py-3 flex-row items-center gap-2"
                style={{
                  backgroundColor: 'rgba(34,197,94,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(34,197,94,0.25)',
                }}
              >
                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                <Text className="font-jakarta-bold text-sm flex-1" style={{ color: '#4ade80' }}>
                  ¡Cambios guardados!
                </Text>
              </View>
            )}
            {submitError != null && (
              <View className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex-row items-start gap-2">
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color="#f87171"
                  style={{ marginTop: 1 }}
                />
                <Text
                  className="font-jakarta-regular text-sm flex-1 leading-5"
                  style={{ color: '#f87171' }}
                >
                  {submitError}
                </Text>
              </View>
            )}
            <Button
              label={isPending ? 'Guardando...' : 'Guardar cambios'}
              onPress={handleSave}
              isLoading={isPending}
              disabled={isPending || submitSuccess}
              variant="primary"
              style={{ borderRadius: 20 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
