import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image, ImageSourcePropType } from 'react-native'
import { Tokens } from '../../../shared/constants/tokens'
import { Ionicons } from '@expo/vector-icons'

// Componente modular para la frase compartible

/**
 * ShareablePhraseCard
 * 
 * Una card diseñada con jerarquía visual de "Story" (Vertical) para ser compartible.
 * Muestra la frase del día sobre un fondo artístico rotativo.
 */

// Pool local de fondos artísticos para que la card funcione sin depender de red.
const STORY_BGS: ImageSourcePropType[] = [
  require('../../../../assets/images/scenes/scene_bible_landscape_path_square_v7.png'),
  require('../../../../assets/images/scenes/scene_eden_serene_square_v8.png'),
  require('../../../../assets/images/scenes/scene_redsea_open_square_v7.png'),
  require('../../../../assets/images/scenes/scene_bible_interior_stone_square_v7.png'),
]

const WATERMARK_LOGO = require('../../../../assets/splash-icon.png')

interface ShareablePhraseCardProps {
  phrase: string
  author?: string
  imageSource?: ImageSourcePropType | null
  onSharePress?: () => void
}

export function ShareablePhraseCard({ 
  phrase, 
  author = "Adoración", 
  imageSource,
  onSharePress 
}: ShareablePhraseCardProps) {
    const [imageAvailable, setImageAvailable] = useState(true)
    const bgSource = useMemo(() => {
        if (imageSource === null) return null

        const date = new Date()
        const bgIndex = date.getDate() % STORY_BGS.length
        return imageSource ?? STORY_BGS[bgIndex]
    }, [imageSource])

    useEffect(() => {
        setImageAvailable(true)
    }, [bgSource])

    const shouldShowImage = Boolean(bgSource && imageAvailable)
    const cardContent = (
        <>
            {shouldShowImage ? <View style={styles.imageOverlay} /> : <View style={styles.fallbackOverlay} />}

            <Image
                source={WATERMARK_LOGO}
                style={styles.watermarkLogo}
                resizeMode="contain"
            />
            
            <View style={styles.content}>
                <Ionicons name="chatbox-ellipses-outline" size={32} color="rgba(15, 223, 223, 0.4)" style={styles.quoteIcon} />
                
                <Text style={styles.phraseText} numberOfLines={5}>
                    {phrase}
                </Text>
                
                <View style={styles.footer}>
                    <View style={styles.divider} />
                    <Text style={styles.authorText}>— {author}</Text>
                </View>
                
                <View style={styles.brandTag}>
                     <Text style={styles.brandText}>ADORACIÓN APP</Text>
                </View>
            </View>
        </>
    )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>FRASE DEL DÍA</Text>
                <TouchableOpacity 
                    style={styles.shareIcon} 
                    onPress={onSharePress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                     <Ionicons name="share-social-outline" size={20} color={Tokens.colors.primary} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.cardWrapper}
                onPress={onSharePress}
            >
                {shouldShowImage ? (
                    <ImageBackground
                        source={bgSource as ImageSourcePropType}
                        style={styles.backgroundImage}
                        imageStyle={styles.imageStyle}
                        onError={() => setImageAvailable(false)}
                    >
                        {cardContent}
                    </ImageBackground>
                ) : (
                    <View style={styles.backgroundImage}>
                        {cardContent}
                    </View>
                )}
                
                {/* Indicador de acción futura */}
                <View style={styles.storyIndicator}>
                    <Text style={styles.indicatorText}>TOCA PARA COMPARTIR EN HISTORIAS</Text>
                    <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.4)" />
                </View>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: Tokens.typography.fontFamily.display,
        fontSize: Tokens.typography.fontSize.h2,
        color: Tokens.colors.textPrimary,
        letterSpacing: 0.5,
    },
    shareIcon: {
        padding: 4,
    },
    cardWrapper: {
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#101018',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    backgroundImage: {
        width: '100%',
        aspectRatio: 3 / 3.8, // Proporción vertical tipo story pero contenida
        justifyContent: 'center',
    },
    imageStyle: {
        opacity: 0.72,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(5, 4, 10, 0.66)',
    },
    fallbackOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#101018',
    },
    watermarkLogo: {
        position: 'absolute',
        right: -12,
        top: '50%',
        width: 104,
        height: 104,
        marginTop: -52,
        opacity: 0.14,
    },
    content: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    quoteIcon: {
        marginBottom: 20,
    },
    phraseText: {
        fontFamily: Tokens.typography.fontFamily.medium,
        fontSize: 24,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 34,
        letterSpacing: -0.5,
    },
    footer: {
        marginTop: 24,
        alignItems: 'center',
    },
    divider: {
        width: 40,
        height: 2,
        backgroundColor: Tokens.colors.primary,
        marginBottom: 12,
        borderRadius: 1,
    },
    authorText: {
        fontFamily: Tokens.typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    brandTag: {
        marginTop: 40,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
    },
    brandText: {
        fontFamily: Tokens.typography.fontFamily.bold,
        fontSize: 8,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 3,
    },
    storyIndicator: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    indicatorText: {
        fontFamily: Tokens.typography.fontFamily.semiBold,
        fontSize: 9,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 1.2,
    }
})
