import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import { getSpriteEntry } from './spriteConfig'
import type { CharacterAnimation, CharacterGender, SpiritualStage } from '../types'

interface SpiritualSpriteCharacterProps {
  gender: CharacterGender
  stage: SpiritualStage
  animation: CharacterAnimation
  style?: StyleProp<ViewStyle>
  fallbackScale?: number
  size?: number // Nuevo: Tamaño determinista para evitar encogimiento
  triggerTs?: number // Nuevo: Permite reiniciar la animación si el timestamp cambia
}

// ─── Fallback silhouette ──────────────────────────────────────────────────────

const CYAN        = 'rgba(15, 223, 223, 0.10)'
const CYAN_STROKE = 'rgba(15, 223, 223, 0.55)'
const HALO_BG     = 'rgba(15, 223, 223, 0.22)'
const EYE_BASE    = 3.5

type SilConfig = { headW: number; headH: number; bodyW: number; bodyH: number; halo?: boolean }

const SILHOUETTE_CFG: Record<SpiritualStage, SilConfig> = {
  baby:   { headW: 21, headH: 25, bodyW: 32, bodyH: 25 },
  child:  { headW: 24, headH: 30, bodyW: 41, bodyH: 30 },
  young:  { headW: 31, headH: 38, bodyW: 60, bodyH: 41 },
  adult:  { headW: 33, headH: 40, bodyW: 67, bodyH: 44, halo: true },
  master: { headW: 35, headH: 42, bodyW: 72, bodyH: 48, halo: true },
}

function SpriteFallback({ stage, scale = 1 }: { stage: SpiritualStage; scale?: number }) {
  const base = SILHOUETTE_CFG[stage]
  if (!base) return null // Seguridad: No crashear si el stage es inválido
  
  const s    = (v: number) => v * scale
  const eyeS = EYE_BASE * scale

  return (
    <View style={sil.wrap}>
      {base.halo && (
        <View style={[sil.halo, { width: s(base.headW + 20), height: s(7), borderRadius: s((base.headW + 20) / 2) }]} />
      )}
      <View style={[sil.head, { width: s(base.headW), height: s(base.headH), borderRadius: s(Math.max(base.headW, base.headH) / 2) }]}>
        <View style={[sil.eye, { width: eyeS, height: eyeS, borderRadius: eyeS / 2, top: s(base.headH * 0.37), left: s(base.headW * 0.22) }]} />
        <View style={[sil.eye, { width: eyeS, height: eyeS, borderRadius: eyeS / 2, top: s(base.headH * 0.37), right: s(base.headW * 0.22) }]} />
      </View>
      <View style={{ height: s(4) }} />
      <View style={[sil.body, { width: s(base.bodyW), height: s(base.bodyH), borderTopLeftRadius: s(base.bodyW * 0.42), borderTopRightRadius: s(base.bodyW * 0.42), borderBottomLeftRadius: s(5), borderBottomRightRadius: s(5) }]} />
    </View>
  )
}

const sil = StyleSheet.create({
  wrap: { alignItems: 'center' },
  halo: { backgroundColor: HALO_BG, marginBottom: 6 },
  head: { backgroundColor: CYAN, borderWidth: 1.5, borderColor: CYAN_STROKE, position: 'relative', overflow: 'hidden' },
  eye:  { position: 'absolute', backgroundColor: CYAN_STROKE },
  body: { backgroundColor: CYAN, borderWidth: 1.5, borderColor: CYAN_STROKE },
})

// ─── SpiritualSpriteCharacter ─────────────────────────────────────────────────

export function SpiritualSpriteCharacter({
  gender,
  stage,
  animation,
  style,
  fallbackScale = 1,
  size,
  triggerTs,
}: SpiritualSpriteCharacterProps) {
  const entry = getSpriteEntry(stage, gender, animation)
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null)
  const [frame, setFrame] = useState(0)

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    if (width > 0 && height > 0) {
      setLayout(prev =>
        prev?.width === width && prev?.height === height ? prev : { width, height }
      )
    }
  }, [])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setFrame(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (!entry || entry.meta.frameCount <= 1) return
    intervalRef.current = setInterval(() => {
      setFrame(f => (f + 1) % entry.meta.frameCount)
    }, 1000 / entry.meta.fps)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [entry, triggerTs])

  if (!entry || (!layout && !size)) {
    return (
      <View style={[styles.container, style]} onLayout={onLayout}>
        <SpriteFallback stage={stage} scale={fallbackScale} />
      </View>
    )
  }

  const { frameWidth, frameHeight, columns, rows, frameCount } = entry.meta
  const activeFrame = frame % frameCount

  // Determinismo: Si recibimos un size explícito, lo usamos sobre el layout detectado
  const finalWidth = size ?? layout?.width ?? 0
  const finalHeight = size ?? layout?.height ?? 0

  // Scale that fits one native frame inside the container (aspect ratio preserved).
  // Multiplicamos por visualScale del asset (normalización visual)
  const baseScale = Math.min(finalWidth / frameWidth, finalHeight / frameHeight)
  const scale = baseScale * (entry.visualScale ?? 1)
  
  const scaledWidth = frameWidth * scale
  const scaledHeight = frameHeight * scale
  // Frame grid position: exact integer multiples of the corrected frame size.
  const col = activeFrame % columns
  const row = Math.floor(activeFrame / columns)

  // React Native transforms from the wrapper center.
  // By removing absolute positioning and manual offsets, we rely on the parent's
  // flexbox centering (alignItems: 'center', justifyContent: 'center').
  return (
    <View style={[styles.container, style, size ? { width: size, height: size } : null]} onLayout={onLayout}>
      <View
        style={{
          width:     frameWidth,
          height:    frameHeight,
          transform: [{ scale }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width:    frameWidth,
            height:   frameHeight,
            overflow: 'hidden',
          }}
        >
          <Image
            source={entry.source}
            resizeMode="stretch"
            style={{
              position: 'absolute',
              left:     0,
              top:      0,
              width:    frameWidth  * columns,
              height:   frameHeight * rows,
              transform: [
                { translateX: -Math.floor(col * frameWidth) },
                { translateY: -Math.floor(row * frameHeight) },
              ],
            }}
            fadeDuration={0}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
})
