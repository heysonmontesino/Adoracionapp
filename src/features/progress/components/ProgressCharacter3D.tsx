/**
 * ProgressCharacter3D
 *
 * Componente público del módulo de Progreso para mostrar el personaje.
 * Vive dentro de CharacterFrame (anillos concéntricos, 92px de núcleo).
 *
 * Ruta activa: sprites 2D vía SpiritualSpriteCharacter.
 * El código 3D (Character3DView, expo-gl, etc.) vive en features/character/3d/
 * y queda disponible pero no es la ruta funcional en esta versión.
 *
 * PARA ACTIVAR SPRITES REALES:
 *   1. Coloca los PNGs en assets/character-sprites/<stage>_<gender>/<animation>.png
 *   2. En spriteConfig.ts, descomenta el require() correspondiente.
 *   3. Este componente renderizará la imagen automáticamente.
 *
 * BRIDGE de dominios:
 *   Progress  CharacterStage:  baby  · child · youth · adult · master
 *   Character SpiritualStage:  baby  · child · teen  · young · adult
 */

import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { SpiritualSpriteCharacter } from '../../character/sprites/SpiritualSpriteCharacter'
import { useCharacterStore } from '../../character/store'
import type { CharacterStage } from '../types'
import type { CharacterGender, SpiritualStage } from '../../character/types'

// ─── Bridge: dominio Progress → dominio Character ─────────────────────────────
// Único punto de traducción entre los dos dominios — no duplicar esta lógica.

const STAGE_BRIDGE: Record<CharacterStage, SpiritualStage> = {
  baby:   'baby',
  child:  'child',
  young:  'young',  // Nivel 3 (Corregido de 'youth')
  adult:  'adult',  // Nivel 4
  master: 'master', // Nivel 5
}

// ─── ProgressCharacter3D ──────────────────────────────────────────────────────

export type AnimSequence = 'idle' | 'pray' | 'celebrate' | 'thinking' | 'greeting' | 'handOnHeart' | 'walk'

const SECONDARY_ANIMS: AnimSequence[] = ['pray', 'celebrate', 'thinking', 'greeting', 'handOnHeart', 'walk']

export function ProgressCharacter3D({
  characterStage,
  gender: propGender,
  size,
  animationTrigger, // Nuevo: Permite disparar animaciones externamente con timestamp
}: {
  characterStage: CharacterStage
  gender?: CharacterGender
  size?: number
  animationTrigger?: { type: AnimSequence; ts: number } | null
}) {
  const storeGender = useCharacterStore((s) => s.gender)
  const gender = propGender ?? storeGender
  const spiritualStage = STAGE_BRIDGE[characterStage]
  const [anim, setAnim] = useState<AnimSequence>('idle')
  const [triggerTs, setTriggerTs] = useState<number | undefined>(undefined)
  
  const lastAnimRef = useRef<AnimSequence>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Efecto para reaccionar a disparadores externos
  useEffect(() => {
    if (animationTrigger && animationTrigger.type !== 'idle') {
      triggerExpressive(animationTrigger.type, animationTrigger.ts)
    }
  }, [animationTrigger])

  // Función unificada para disparar una animación expresiva
  const triggerExpressive = (targetAnim?: AnimSequence, ts?: number) => {
    // Stage 5 (Master) solo tiene animaciones específicas
    const masterAnims: AnimSequence[] = ['pray', 'greeting', 'thinking']
    
    let nextAnim = targetAnim
    
    if (!nextAnim) {
      const pool = (spiritualStage === 'master' ? masterAnims : SECONDARY_ANIMS)
        .filter(a => a !== lastAnimRef.current)
      
      nextAnim = pool.length > 0 
        ? pool[Math.floor(Math.random() * pool.length)]
        : (spiritualStage === 'master' ? 'pray' : 'celebrate')
    }

    // Si es Master y la animación pedida no existe, fallback a una válida
    if (spiritualStage === 'master' && !masterAnims.includes(nextAnim) && nextAnim !== 'idle') {
      nextAnim = 'pray'
    }
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    setAnim(nextAnim)
    setTriggerTs(ts ?? Date.now()) // Actualizamos el trigger para que SpiritualSpriteCharacter reinicie
    lastAnimRef.current = nextAnim

    // Volver a idle después de ~6s (2 ciclos de 36 frames @ 12fps)
    timeoutRef.current = setTimeout(() => {
      setAnim('idle')
      lastAnimRef.current = 'idle'
      timeoutRef.current = null
    }, 6000) 
  }

  const triggerRandomExpressive = () => triggerExpressive()

  // Loop de vida sutil (solo dispara si estamos en idle)
  useEffect(() => {
    const interval = setInterval(() => {
      // Solo disparamos vida aleatoria si el personaje no está ya haciendo algo
      if (anim === 'idle' && !timeoutRef.current) {
        if (Math.random() > 0.7) { 
          triggerRandomExpressive()
        }
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [anim])

  // Limpieza de timeouts al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <Pressable 
      onPress={triggerRandomExpressive}
      style={styles.container}
      hitSlop={20}
    >
      <SpiritualSpriteCharacter
        gender={gender}
        stage={spiritualStage}
        animation={anim}
        size={size}
        triggerTs={triggerTs}
        style={styles.sprite}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: '100%',
    height: '100%',
  },
})
