/**
 * Character3DView
 *
 * Renders a single GLB character with animation support using expo-gl + three.js.
 * Sits on top of a background layer (handled by the parent via ImageBackground/View).
 * The GL canvas background is transparent (alpha: true) so the parent background shows through.
 *
 * USAGE:
 *   <Character3DView
 *     glbAsset={require('../../../assets/character/baby_boy/spirit_baby_boy.glb')}
 *     animation="idle"
 *     stageBackground={getStageBackground('baby')}
 *     style={{ width: '100%', height: 400 }}
 *   />
 *
 * ASSET REQUIREMENT:
 *   The GLB must contain all animation clips named exactly:
 *     idle, walk, celebrate, pray
 *   One GLB per character with all clips embedded (not split across files).
 *
 * LIMITATIONS (honest):
 *   - expo-gl requires a physical device or simulator; not supported in Jest.
 *   - Animation transitions are instant (no cross-fade). Cross-fade can be added
 *     with mixer.crossFadeTo() if needed post-MVP.
 *   - Draco-compressed GLBs require DRACOLoader — avoid Draco compression when
 *     exporting from Blender for now.
 *   - newArchEnabled: true may emit a thread warning on Android; not a crash.
 */

import React, { useRef, useCallback } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl'
import { Renderer } from 'expo-three'
import * as THREE from 'three'
import { GLTFLoader } from 'three-stdlib'
import type { GLTF } from 'three-stdlib'
import type { StageBackground } from './stageConfig'
import { ANIMATION_CLIP_NAMES } from './stageConfig'
import type { CharacterAnimation } from '../types'

export type CharacterTextureAssets = Record<string, number>

interface Character3DViewProps {
  /** Static require() of the .glb file. Use null to render nothing (parent shows placeholder). */
  glbAsset: number
  /** Static require() map for texture files referenced by the GLB. */
  textureAssets?: CharacterTextureAssets
  animation: CharacterAnimation
  stageBackground: StageBackground
  style?: StyleProp<ViewStyle>
}

class SolidFallbackTextureLoader extends THREE.Loader {
  constructor(
    manager: THREE.LoadingManager,
    private readonly textureAssets: CharacterTextureAssets,
  ) {
    super(manager)
  }

  load(
    url: string,
    onLoad?: (texture: THREE.Texture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: unknown) => void,
  ): THREE.Texture {
    const fileName = decodeURIComponent((url.split('/').pop() ?? url).split('?')[0])
    const keyWithoutExtension = fileName.replace(/\.(png|jpe?g)$/i, '')
    const textureAsset = this.textureAssets[fileName] ?? this.textureAssets[keyWithoutExtension]

    if (!textureAsset) {
      const error = new Error(`Missing static texture asset for GLB image "${fileName}"`)
      onError?.(error)
      return new THREE.Texture()
    }

    const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
    texture.needsUpdate = true
    onLoad?.(texture)

    return texture
  }
}

export function Character3DView({
  glbAsset,
  textureAssets,
  animation,
  stageBackground,
  style,
}: Character3DViewProps) {
  // Refs kept across renders without triggering re-render
  const rendererRef = useRef<Renderer | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const clockRef = useRef(new THREE.Clock())
  const clipsRef = useRef<Map<string, THREE.AnimationClip>>(new Map())
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)
  const animationFrameRef = useRef<number>(0)
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null)

  // Play a clip by name; silently no-ops if clip not found
  const playClip = useCallback((mixer: THREE.AnimationMixer, clipName: string) => {
    const resolved = ANIMATION_CLIP_NAMES[clipName] ?? 'idle'
    const clip = clipsRef.current.get(resolved)
    if (!clip) return

    if (currentActionRef.current) {
      currentActionRef.current.stop()
    }
    const action = mixer.clipAction(clip)
    action.reset().play()
    currentActionRef.current = action
  }, [])

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      glRef.current = gl

      // ── Renderer ────────────────────────────────────────────────────────────
      const renderer = new Renderer({ gl, alpha: true })
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight)
      renderer.setClearColor(0x000000, 0) // fully transparent background
      renderer.shadowMap.enabled = true
      rendererRef.current = renderer

      // ── Scene ────────────────────────────────────────────────────────────────
      const scene = new THREE.Scene()

      // ── Camera ───────────────────────────────────────────────────────────────
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight
      const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100)
      // Position camera slightly above center, looking down slightly at the character
      camera.position.set(0, 1.2, 3.5)
      camera.lookAt(0, 0.8, 0)

      // ── Lighting ─────────────────────────────────────────────────────────────
      const ambientLight = new THREE.AmbientLight(
        stageBackground.ambientColor,
        stageBackground.lightIntensity * 0.6,
      )
      scene.add(ambientLight)

      const dirLight = new THREE.DirectionalLight(0xfff4e0, stageBackground.lightIntensity)
      dirLight.position.set(2, 5, 3)
      dirLight.castShadow = true
      scene.add(dirLight)

      // Soft fill from opposite side
      const fillLight = new THREE.DirectionalLight(stageBackground.ambientColor, 0.3)
      fillLight.position.set(-2, 2, -1)
      scene.add(fillLight)

      // ── Load GLB ─────────────────────────────────────────────────────────────
      // expo-asset resolves the require() number to a URI at runtime
      const { Asset } = await import('expo-asset')
      const asset = Asset.fromModule(glbAsset)
      await asset.downloadAsync()

      const manager = new THREE.LoadingManager()

      if (textureAssets && Object.keys(textureAssets).length > 0) {
        const textureLoader = new SolidFallbackTextureLoader(manager, textureAssets)
        manager.addHandler(/\.(png|jpe?g)$/i, textureLoader)
      }

      const loader = new GLTFLoader(manager)

      await new Promise<void>((resolve, reject) => {
        loader.load(
          asset.localUri ?? asset.uri,
          (gltf: GLTF) => {
            const model = gltf.scene

            // Center and scale the model
            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 1.6 / maxDim // normalize to ~1.6 units tall
            model.scale.setScalar(scale)
            model.position.sub(center.multiplyScalar(scale))
            model.position.y = 0 // feet on ground

            // Enable shadows on all meshes
            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true
                child.receiveShadow = true
              }
            })

            scene.add(model)

            // Store clips by name for fast lookup
            gltf.animations.forEach((clip) => {
              clipsRef.current.set(clip.name, clip)
            })

            // Start animation mixer
            const mixer = new THREE.AnimationMixer(model)
            mixerRef.current = mixer
            playClip(mixer, animation)

            resolve()
          },
          undefined, // onProgress — not needed
          (err) => reject(err),
        )
      })

      // ── Render loop ───────────────────────────────────────────────────────────
      const render = () => {
        animationFrameRef.current = requestAnimationFrame(render)
        const delta = clockRef.current.getDelta()
        if (mixerRef.current) {
          mixerRef.current.update(delta)
        }
        renderer.render(scene, camera)
        gl.endFrameEXP()
      }

      render()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [glbAsset, textureAssets, stageBackground.ambientColor, stageBackground.lightIntensity],
  )

  // Switch animation when the prop changes (without reloading the model)
  React.useEffect(() => {
    if (mixerRef.current) {
      playClip(mixerRef.current, animation)
    }
  }, [animation, playClip])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      mixerRef.current?.stopAllAction()
      rendererRef.current?.dispose()
    }
  }, [])

  return <GLView style={style} onContextCreate={onContextCreate} />
}
