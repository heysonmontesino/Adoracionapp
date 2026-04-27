import { useState } from 'react'
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../../../src/shared/components/layout/Screen'
import { Button } from '../../../../src/shared/components/ui/Button'
import { Colors } from '../../../../src/shared/constants/colors'
import { useAuthStore } from '../../../../src/features/auth/store'
import { useCreatePrayerRequest } from '../../../../src/features/community/prayer-requests/hooks/useCreatePrayerRequest'
import { Ionicons } from '@expo/vector-icons'
import type { PrayerRequestType, PrayerRequestCategory } from '../../../../src/features/community/prayer-requests/types'
import type { CreatePrayerRequestVariables } from '../../../../src/features/community/prayer-requests/hooks/useCreatePrayerRequest'

const CATEGORIES: { label: string; value: PrayerRequestCategory }[] = [
  { label: 'General', value: 'general' },
  { label: 'Salud', value: 'salud' },
  { label: 'Familia', value: 'familia' },
  { label: 'Finanzas', value: 'finanzas' },
  { label: 'Otros', value: 'otros' },
]

export default function CreatePrayerRequestScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'member'

  const [type, setType] = useState<PrayerRequestType>('community')
  const [category, setCategory] = useState<PrayerRequestCategory>('general')
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // mutateAsync garantiza que el error siempre se propague a nuestro try/catch
  const { mutateAsync: createAsync, isPending } = useCreatePrayerRequest()

  const bodyLength = body.trim().length
  const canSubmit = bodyLength >= 10

  async function handleSubmit() {
    console.log('[PrayerCreate/UI] submit pressed', {
      userId: user?.uid ?? 'NULL',
      canSubmit,
      bodyLength,
      isPending,
    })

    if (isPending) {
      console.log('[PrayerCreate/UI] blocked: already submitting')
      return
    }

    if (!user) {
      console.warn('[PrayerCreate/UI] blocked: user is null in auth store')
      Alert.alert('Sesión requerida', 'Por favor inicia sesión para enviar una petición.')
      return
    }

    if (!canSubmit) {
      console.log('[PrayerCreate/UI] blocked: body too short', bodyLength)
      setSubmitError(`Necesitas al menos 10 caracteres. Tienes ${bodyLength}.`)
      return
    }

    console.log('[PrayerCreate/UI] validation passed')
    setSubmitError(null)
    setSubmitSuccess(false)

    const variables: CreatePrayerRequestVariables = {
      userId: user.uid,
      displayName: user.displayName ?? null,
      role,
      input: {
        type,
        category,
        body: body.trim(),
        title: title.trim() || undefined,
        anonymous,
      },
    }

    console.log('[PrayerCreate/UI] payload ready', {
      userId: variables.userId,
      type: variables.input.type,
      category: variables.input.category,
      bodyLength: variables.input.body.length,
      anonymous: variables.input.anonymous,
      role: variables.role,
    })

    try {
      await createAsync(variables)
      console.log('[PrayerCreate/UI] mutation success — showing banner')
      setSubmitSuccess(true)
      setTimeout(() => {
        console.log('[PrayerCreate/UI] navigating to prayer requests list')
        router.replace('/(tabs)/community/prayer-requests')
      }, 800)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[PrayerCreate/UI] mutation error — remaining on screen:', msg)
      setSubmitError(`No pudimos enviar tu petición:\n${msg}`)
    }
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
              <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-surface-bright items-center justify-center">
                <Ionicons name="arrow-back" size={20} color="white" />
              </TouchableOpacity>
              <Text className="font-humane text-6xl text-on-surface uppercase leading-none pt-2">NUEVA PETICIÓN</Text>
            </View>
            <Text className="font-jakarta-regular text-base text-on-surface/60 leading-relaxed">
              {type === 'community' 
                ? 'Permite que toda la comunidad se una en oración por ti.' 
                : 'Un espacio confidencial bajo el cuidado del equipo pastoral.'}
            </Text>
          </View>

          {/* Visibility Type Selector */}
          <View>
            <Text className="font-jakarta-bold text-xs uppercase tracking-[1.5px] text-primary mb-3">Alcance de la petición</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => setType('community')}
                className={`flex-1 rounded-2xl p-4 items-center border ${type === 'community' ? 'bg-primary border-primary' : 'bg-surface-container-low border-on-surface/5'}`}
              >
                <Ionicons name="people" size={20} color={type === 'community' ? 'black' : 'white'} />
                <Text className={`font-jakarta-bold text-xs mt-2 ${type === 'community' ? 'text-black' : 'text-on-surface/60'}`}>COMUNITARIA</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setType('pastoral')}
                className={`flex-1 rounded-2xl p-4 items-center border ${type === 'pastoral' ? 'bg-surface-bright border-primary' : 'bg-surface-container-low border-on-surface/5'}`}
              >
                <Ionicons name="heart" size={20} color={type === 'pastoral' ? Colors.primary : 'white'} />
                <Text className={`font-jakarta-bold text-xs mt-2 ${type === 'pastoral' ? 'text-primary' : 'text-on-surface/60'}`}>PASTORAL</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Selector */}
          <View>
            <Text className="font-jakarta-bold text-xs uppercase tracking-[1.5px] text-primary mb-3">Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  className={`px-5 py-3 rounded-full border ${category === cat.value ? 'bg-primary border-primary' : 'bg-surface-container-low border-on-surface/5'}`}
                >
                  <Text className={`font-jakarta-bold text-xs ${category === cat.value ? 'text-black' : 'text-on-surface/60'}`}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title and Body */}
          <View className="gap-4">
            <View>
              <Text className="font-jakarta-bold text-xs uppercase tracking-[1.5px] text-primary mb-3">Título</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Ej: Por la salud de mi familia" placeholderTextColor={Colors.onSurface40} className="rounded-2xl bg-surface-container-low px-5 py-4 font-jakarta-medium text-base text-on-surface border border-on-surface/5" maxLength={80} />
            </View>
            <View>
              <Text className="font-jakarta-bold text-xs uppercase tracking-[1.5px] text-primary mb-3">Detalles de la petición *</Text>
              <TextInput value={body} onChangeText={(t) => { setBody(t); if (submitError) setSubmitError(null) }} placeholder="Comparte lo que está en tu corazón..." placeholderTextColor={Colors.onSurface40} className="rounded-3xl bg-surface-container-low px-5 py-5 font-jakarta-regular text-base text-on-surface border border-on-surface/5" multiline numberOfLines={5} textAlignVertical="top" maxLength={1000} style={{ minHeight: 140 }} />
              <View className="flex-row justify-between mt-2 px-1">
                <Text className="font-jakarta-medium text-[10px] text-on-surface/30">{type === 'community' ? 'Visible para todos' : 'Solo Líderes'}</Text>
                <Text className="font-jakarta-medium text-[10px] text-on-surface/40">{body.length} / 1000</Text>
              </View>
            </View>
          </View>

          {/* Anonymity */}
          <View className="rounded-3xl bg-surface-container-low p-5 border border-on-surface/5 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="eye-off-outline" size={16} color={Colors.primary} />
                <Text className="font-jakarta-bold text-sm text-on-surface">Publicar sin mi nombre</Text>
              </View>
              <Text className="font-jakarta-regular text-xs text-on-surface/60 leading-5">Tu nombre no será visible {type === 'community' ? 'para la comunidad' : 'para el equipo pastoral'}.</Text>
            </View>
            <Switch value={anonymous} onValueChange={setAnonymous} trackColor={{ false: Colors.surfaceBright, true: Colors.primary }} thumbColor="white" />
          </View>

          <View className="mt-4 gap-3">
            {/* Validation hint when body is too short */}
            {bodyLength > 0 && !canSubmit && (
              <View className="flex-row items-center gap-2 px-1">
                <Ionicons name="alert-circle-outline" size={14} color="#f87171" />
                <Text className="font-jakarta-medium text-xs" style={{ color: '#f87171' }}>
                  Necesitas al menos 10 caracteres ({bodyLength}/10)
                </Text>
              </View>
            )}
            {/* Success banner — visible 800ms antes de navegar */}
            {submitSuccess && (
              <View className="rounded-2xl px-4 py-3 flex-row items-center gap-2" style={{ backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' }}>
                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                <Text className="font-jakarta-bold text-sm flex-1" style={{ color: '#4ade80' }}>
                  ¡Petición enviada! La comunidad orará contigo.
                </Text>
              </View>
            )}
            {/* Firestore / auth error */}
            {submitError != null && (
              <View className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex-row items-start gap-2">
                <Ionicons name="warning-outline" size={16} color="#f87171" style={{ marginTop: 1 }} />
                <Text className="font-jakarta-regular text-sm flex-1 leading-5" style={{ color: '#f87171' }}>
                  {submitError}
                </Text>
              </View>
            )}
            <Button
              label={isPending ? 'Enviando...' : (type === 'community' ? 'Compartir con la Comunidad' : 'Enviar al Equipo Pastoral')}
              onPress={handleSubmit}
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
