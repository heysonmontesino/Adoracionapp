/**
 * SpiritualCharacterPreviewScreen
 *
 * A self-contained demo screen for testing 3D character rendering.
 * Accessible from the progress tab via the debug button, or directly
 * via the route /character-preview (see app/(tabs)/character-preview.tsx).
 *
 * What this screen validates:
 *   ✓ Character renders correctly in GLView
 *   ✓ Gender toggle works (boy ↔ girl)
 *   ✓ Animation switching works without reloading the model
 *   ✓ Stage background renders below the transparent GLView
 *   ✓ Visual direction (warm, spiritual, non-cartoonish) is approachable
 *
 * This screen is NOT connected to real user progress.
 * It has its own local state entirely.
 */

import React, { useState } from 'react'
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SpiritualSpriteCharacter } from '../sprites/SpiritualSpriteCharacter'
import { getSpriteStageBackground } from '../sprites/stageBackgroundConfig'
import type { CharacterAnimation, CharacterGender, SpiritualStage } from '../types'

// ─── Demo-only types ──────────────────────────────────────────────────────────

const GENDERS: CharacterGender[] = ['male', 'female']
const ANIMATIONS: CharacterAnimation[] = ['idle', 'walk', 'pray', 'celebrate']
const STAGES: SpiritualStage[] = ['baby', 'child', 'young', 'adult', 'master']

const GENDER_LABELS: Record<CharacterGender, string> = {
  male: 'Hombre',
  female: 'Mujer',
}

const ANIMATION_LABELS: Record<string, string> = {
  idle: 'Reposo',
  walk: 'Caminar',
  pray: 'Orar',
  celebrate: 'Celebrar',
}

const STAGE_LABELS: Record<SpiritualStage, string> = {
  baby: 'Bebé espiritual',
  child: 'Niño espiritual',
  young: 'Joven maduro',
  adult: 'Adulto',
  master: 'Mentor',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleRow<T extends string>({
  label,
  options,
  value,
  getLabel,
  onSelect,
}: {
  label: string
  options: T[]
  value: T
  getLabel: (v: T) => string
  onSelect: (v: T) => void
}) {
  return (
    <View className="mb-4">
      <Text className="font-jakarta-medium text-xs uppercase tracking-[2px] text-on-surface/50 mb-2">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option === value
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onSelect(option)}
              activeOpacity={0.8}
              className={`rounded-full px-4 py-2 ${
                active ? 'bg-primary' : 'bg-surface-container'
              }`}
            >
              <Text
                className={`font-jakarta-medium text-sm ${
                  active ? 'text-background' : 'text-on-surface/70'
                }`}
              >
                {getLabel(option)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function SpiritualCharacterPreviewScreen() {
  const [gender, setGender] = useState<CharacterGender>('male')
  const [animation, setAnimation] = useState<CharacterAnimation>('idle')
  const [stage, setStage] = useState<SpiritualStage>('baby')

  const bgConfig = getSpriteStageBackground(stage)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgConfig.gradientTop }}>
      {/* ── Background layer ─────────────────────────────────────────── */}
      {bgConfig.imageSource !== null ? (
        <ImageBackground
          source={bgConfig.imageSource}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
      ) : (
        // Gradient fallback rendered as two stacked views
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: bgConfig.gradientTop,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60%',
              backgroundColor: bgConfig.gradientBottom,
              opacity: 0.85,
            }}
          />
        </View>
      )}

      {/* ── Character viewport (60% of screen height) ────────────────── */}
      <View style={{ flex: 1 }}>
        {/* Stage label */}
        <View className="items-center pt-4">
          <Text className="font-jakarta-medium text-xs uppercase tracking-[3px] text-primary/80">
            {STAGE_LABELS[stage]}
          </Text>
        </View>

        {/* Character — sprite 2D sobre el fondo */}
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <SpiritualSpriteCharacter
            gender={gender}
            animation={animation}
            stage={stage}
            style={{ width: '100%', height: 380 }}
            fallbackScale={3.5}
          />
        </View>

        {/* Current animation label */}
        <View className="items-center pb-3">
          <Text className="font-humane text-3xl text-on-surface/60 uppercase tracking-[2px]">
            {ANIMATION_LABELS[animation] ?? animation}
          </Text>
        </View>
      </View>

      {/* ── Controls panel ───────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: 'rgba(19, 16, 38, 0.90)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 20,
          paddingHorizontal: 24,
          paddingBottom: 16,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <ToggleRow
            label="Personaje"
            options={GENDERS}
            value={gender}
            getLabel={(g) => GENDER_LABELS[g]}
            onSelect={setGender}
          />
          <ToggleRow
            label="Animación"
            options={ANIMATIONS}
            value={animation}
            getLabel={(a) => ANIMATION_LABELS[a] ?? a}
            onSelect={setAnimation}
          />
          <ToggleRow
            label="Etapa espiritual (fondo)"
            options={STAGES}
            value={stage}
            getLabel={(s) => STAGE_LABELS[s]}
            onSelect={setStage}
          />

          <View className="mt-2 rounded-2xl bg-surface-container/60 p-4">
            <Text className="font-jakarta-medium text-xs uppercase tracking-[1px] text-primary mb-1">
              Estado del asset
            </Text>
            <Text className="font-jakarta-regular text-sm text-on-surface/60 leading-6">
              Personaje: {gender === 'male' ? 'baby_boy (sprite)' : 'baby_girl (sprite)'}
            </Text>
            <Text className="font-jakarta-regular text-sm text-on-surface/60 leading-6">
              Fondo: {bgConfig.imageSource !== null ? 'imagen PNG cargada' : 'gradiente de fallback'}
            </Text>
            <Text className="font-jakarta-regular text-xs text-on-surface/40 leading-6 mt-1">
              Coloca los PNGs en assets/character-sprites/baby_*/
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
