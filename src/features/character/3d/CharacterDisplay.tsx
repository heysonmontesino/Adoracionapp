/**
 * CharacterDisplay
 *
 * The public component that screens use to show a character.
 * - If the GLB asset is available (non-null): renders Character3DView
 * - If the GLB asset is null: renders CharacterPlaceholder (existing 2D stand-in)
 *
 * This is the component that replaces CharacterPlaceholder in production.
 * The swap is: change CHARACTER_ASSETS entries from null to require() calls
 * once the GLB files exist in assets/character/.
 */

import React from 'react'
import { View, StyleProp, ViewStyle } from 'react-native'
import { CharacterPlaceholder } from '../CharacterPlaceholder'
import { Character3DView } from './Character3DView'
import { CHARACTER_TEXTURE_ASSETS, getStageBackground } from './stageConfig'
import { CHARACTER_ASSETS, type CharacterAssetKey } from './stageConfig'
import type { CharacterAnimation, CharacterGender, SpiritualStage } from '../types'

interface CharacterDisplayProps {
  gender: CharacterGender
  animation: CharacterAnimation
  stage: SpiritualStage
  style?: StyleProp<ViewStyle>
}

function genderToAssetKey(gender: CharacterGender, stage: SpiritualStage): CharacterAssetKey {
  // For now only baby exists; future: `${stage}_${gender}` pattern
  return `${stage === 'baby' ? 'baby' : stage}_${gender}` as CharacterAssetKey
}

export function CharacterDisplay({ gender, animation, stage, style }: CharacterDisplayProps) {
  const assetKey = genderToAssetKey(gender, stage)
  const glbAsset = CHARACTER_ASSETS[assetKey] ?? null
  const textureAssets = CHARACTER_TEXTURE_ASSETS[assetKey]
  const background = getStageBackground(stage)

  if (glbAsset === null) {
    // Asset not yet placed — show 2D placeholder
    return (
      <View style={style}>
        <CharacterPlaceholder />
      </View>
    )
  }

  return (
    <Character3DView
      glbAsset={glbAsset}
      textureAssets={textureAssets}
      animation={animation}
      stageBackground={background}
      style={style}
    />
  )
}
