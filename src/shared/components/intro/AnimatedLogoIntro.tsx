/**
 * AnimatedLogoIntro
 *
 * Renders the animated logo spritesheet after the native splash screen.
 * Frames are read left-to-right, then top-to-bottom.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
  ImageSourcePropType,
} from 'react-native'

export interface LogoIntroConfig {
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  frameCount: number
  fps: number
}

export const LOGO_INTRO_CONFIG: LogoIntroConfig = {
  frameWidth:  306,
  frameHeight: 424,
  columns:     6,
  rows:        6,
  frameCount:  36,
  fps:         12,
}

export const LOGO_INTRO_SOURCE: ImageSourcePropType =
  require('../../../../assets/images/animatelogo.png')

// ─── Component props ──────────────────────────────────────────────────────────
interface AnimatedLogoIntroProps {
  /** Called once the full animation sequence completes */
  onFinished: () => void
  /** Override spritesheet config (optional) */
  config?: Partial<LogoIntroConfig>
  /** Additional hold time after last frame (ms) before onFinished fires */
  holdMs?: number
}

// ─── AnimatedLogoIntro ────────────────────────────────────────────────────────
export function AnimatedLogoIntro({
  onFinished,
  config: configOverride,
  holdMs = 300,
}: AnimatedLogoIntroProps) {
  const cfg: LogoIntroConfig = { ...LOGO_INTRO_CONFIG, ...configOverride }
  const { frameWidth, frameHeight, columns, rows, frameCount, fps } = cfg

  const [frame, setFrame] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishedRef = useRef(false)

  // Fade animations
  const fadeIn  = useRef(new Animated.Value(0)).current
  const fadeOut = useRef(new Animated.Value(1)).current

  // Responsive scale: fit within the screen keeping aspect ratio
  const { width: screenW, height: screenH } = Dimensions.get('window')
  const maxSize = Math.min(screenW * 0.7, screenH * 0.42)
  const scale   = maxSize / Math.max(frameWidth, frameHeight)
  const displayW = frameWidth  * scale
  const displayH = frameHeight * scale
  const sheetW = columns * frameWidth * scale
  const sheetH = rows * frameHeight * scale
  const col = frame % columns
  const row = Math.floor(frame / columns)

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true

    // Fade out the whole intro screen
    Animated.timing(fadeOut, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => onFinished())
  }, [fadeOut, onFinished])

  useEffect(() => {
    // Fade in the intro
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start()

    const frameDuration = 1000 / fps
    intervalRef.current = setInterval(() => {
      setFrame((prev) => {
        const next = prev + 1

        if (next >= frameCount) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          holdTimeoutRef.current = setTimeout(finish, holdMs)
          return frameCount - 1
        }

        return next
      })
    }, frameDuration)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: Animated.multiply(fadeIn, fadeOut) },
      ]}
    >
      <View
        style={{
          width:    displayW,
          height:   displayH,
          overflow: 'hidden',
        }}
      >
        <Image
          source={LOGO_INTRO_SOURCE}
          style={{
            width: sheetW,
            height: sheetH,
            position: 'absolute',
            left: -(col * frameWidth * scale),
            top: -(row * frameHeight * scale),
            tintColor: '#0fdfdf',
          }}
          resizeMode="stretch"
          fadeDuration={0}
        />
      </View>
    </Animated.View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#262431',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          9999,
    // Hardware-accelerate the view on both platforms
    ...Platform.select({
      ios:     { renderToHardwareTextureAndroid: false },
      android: { renderToHardwareTextureAndroid: true },
    }),
  },
})
