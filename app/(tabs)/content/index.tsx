import { ScrollView, Text, TouchableOpacity, View, StyleSheet, Image, Linking, Alert } from 'react-native'
import { Screen } from '../../../src/shared/components/layout/Screen'
import { AppHeader } from '../../../src/shared/components/ui/AppHeader'
import { Tokens } from '../../../src/shared/constants/tokens'
import { useContentFeed } from '../../../src/features/content/hooks/useContentFeed'
import { Ionicons } from '@expo/vector-icons'
import { CHURCH_YOUTUBE } from '../../../src/shared/constants/church'

// ─── Apertura de YouTube ───────────────────────────────────────────────────────
// Acepta una URL completa (canal, video, playlist) o un videoId corto.
// Intenta abrir en la app de YouTube; si falla, abre en navegador.

async function openYouTubeURL(urlOrVideoId: string): Promise<void> {
  const webUrl = urlOrVideoId.startsWith('http')
    ? urlOrVideoId
    : `https://www.youtube.com/watch?v=${urlOrVideoId}`
  const appUrl = webUrl.replace('https://', 'youtube://')
  try {
    const supported = await Linking.canOpenURL(appUrl)
    await Linking.openURL(supported ? appUrl : webUrl)
  } catch {
    try {
      await Linking.openURL(webUrl)
    } catch {
      Alert.alert('Error', 'No se pudo abrir YouTube. Verifica que tengas conexión a internet.')
    }
  }
}

async function openSpotifyURL(url: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url)
    if (!supported) {
      Alert.alert('Spotify', 'No pudimos abrir Spotify en este momento.')
      return
    }

    await Linking.openURL(url)
  } catch {
    Alert.alert('Spotify', 'No pudimos abrir Spotify en este momento.')
  }
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=800'

const SPOTIFY_LINKS = [
  {
    id: 'spotify-sermons',
    title: 'Prédicas en Spotify',
    subtitle: 'Escucha los mensajes de la iglesia en audio.',
    icon: 'mic-outline',
    url: 'https://open.spotify.com/show/6Ozvc9yuS5OX4cnnW1EjVO?si=2oDltZdrSxWUbkmBIv9p3w',
  },
  {
    id: 'spotify-songs',
    title: 'Canciones que cantamos',
    subtitle: 'Una selección para acompañar la adoración de la semana.',
    icon: 'musical-notes-outline',
    url: 'https://open.spotify.com/playlist/4Vsq08vdJWny4l4X6Szgat?si=fNH5QQokQgChxmrbyOg5ow&pi=uM1Lw2VkQdOgj',
  },
  {
    id: 'spotify-worship',
    title: 'Playlist de adoración',
    subtitle: 'Música para orar, descansar y volver el corazón a Dios.',
    icon: 'headset-outline',
    url: 'https://open.spotify.com/playlist/2IUtj2jc4UyOYlAqKAFFYL?si=ZOB8_wmtQS6sm6Axpxybdw&pi=AkMh-M_DROS50',
  },
] as const

// ─── Skeleton Component ────────────────────────────────────────────────────────

function ContentSkeleton() {
  return (
    <View style={styles.scrollContent}>
      <AppHeader variant="screen" title="CONTENIDO" subtitle="Preparando tu contenido..." />
      
      {/* Live Skeleton */}
      <View style={styles.section}>
        <View style={[styles.liveCard, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
           <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
             <View style={{ width: 80, height: 20, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />
             <View style={{ width: '70%', height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 4 }} />
             <View style={{ width: '40%', height: 16, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' }} />
           </View>
        </View>
      </View>

      {/* Latest Skeleton */}
      <View style={styles.section}>
        <View style={{ width: 120, height: 12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.videoCard, { marginBottom: 16 }]}>
            <View style={[styles.videoThumb, { backgroundColor: 'rgba(255,255,255,0.03)' }]} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ width: '90%', height: 16, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <View style={{ width: '30%', height: 12, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </View>
          </View>
        ))}
      </View>

      {/* Series Skeleton */}
      <View style={styles.section}>
        <View style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={[styles.seriesCard, { width: 280, height: 157, backgroundColor: 'rgba(255,255,255,0.03)' }]} />
          <View style={[styles.seriesCard, { width: 280, height: 157, backgroundColor: 'rgba(255,255,255,0.03)' }]} />
        </View>
      </View>
    </View>
  )
}

export default function ContentScreen() {
  const { data: feed, isLoading, isError, refetch } = useContentFeed()

  if (isLoading) {
    return (
      <Screen>
        <ContentSkeleton />
      </Screen>
    )
  }

  if (isError) {
    return (
      <Screen>
        <AppHeader variant="screen" title="CONTENIDO" />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Tokens.colors.error} style={{ marginBottom: 16 }} />
          <Text style={styles.error}>No pudimos cargar el contenido.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>VOLVER A INTENTAR</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          variant="screen"
          title="CONTENIDO"
          subtitle="Prédicas, series y transmisiones en vivo."
        />

        {/* 1. Live / Upcoming Section */}
        {feed?.live && feed.live.status !== 'none' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.liveCard, feed.live.status === 'live' && styles.liveCardActive]}
              activeOpacity={0.9}
              onPress={() => openYouTubeURL(feed.live.video?.url ?? CHURCH_YOUTUBE.liveUrl)}
            >
              <Image 
                source={{ uri: (feed.live.video?.thumbnail && feed.live.video.thumbnail !== 'null') ? feed.live.video.thumbnail : PLACEHOLDER_IMAGE }} 
                style={StyleSheet.absoluteFill} 
              />
              {/* Cinematic Gradient Overlay */}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
              <View style={[StyleSheet.absoluteFill, { 
                backgroundColor: 'transparent', 
                borderBottomWidth: 100, 
                borderBottomColor: 'rgba(0,0,0,0.6)',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0
              }]} />
              
              <View style={styles.liveOverlay}>
                <View style={[styles.badge, feed.live.status === 'live' ? styles.badgeLive : styles.badgeUpcoming]}>
                  {feed.live.status === 'live' && <View style={styles.pulseDot} />}
                  <Text style={styles.badgeText}>
                    {feed.live.status === 'live' ? 'EN VIVO AHORA' : 'PRÓXIMO EN VIVO'}
                  </Text>
                </View>
                <Text style={styles.liveTitle} numberOfLines={2}>
                  {feed.live.video?.title || 'Servicio Especial'}
                </Text>
                {feed.live.status === 'upcoming' && (
                  <View style={styles.liveTag}>
                    <Ionicons name="time-outline" size={14} color={Tokens.colors.primary} />
                    <Text style={styles.liveTime}>
                      {feed.live.video?.scheduledStartTime 
                        ? `Inicio: ${new Date(feed.live.video.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'HORARIO POR CONFIRMAR'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. Latest Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ÚLTIMAS PRÉDICAS</Text>
          </View>
          <View style={styles.latestGrid}>
            {feed?.latest.map((video) => (
              <TouchableOpacity
                key={video.id}
                style={styles.videoCard}
                activeOpacity={0.8}
                onPress={() => openYouTubeURL(video.url ?? video.id)}
              >
                <View style={styles.videoThumbContainer}>
                  <Image 
                    source={{ uri: (video.thumbnail && video.thumbnail !== 'null') ? video.thumbnail : PLACEHOLDER_IMAGE }} 
                    style={styles.videoThumb} 
                  />
                  <View style={styles.playIconOverlay}>
                    <Ionicons name="play" size={20} color="#FFF" />
                  </View>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                  {video.publishedAt && (
                    <Text style={styles.videoMeta}>
                      {new Date(video.publishedAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Series Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SERIES RECIENTES</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.seriesScroll}
            snapToInterval={296} // 280 (card) + 16 (gap)
            decelerationRate="fast"
          >
            {feed?.series.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.seriesCard}
                activeOpacity={0.9}
                onPress={() => openYouTubeURL(item.playlistId ? `https://www.youtube.com/playlist?list=${item.playlistId}` : CHURCH_YOUTUBE.playlistsUrl)}
              >
                <Image 
                  source={{ uri: (item.thumbnail && item.thumbnail !== 'null') ? item.thumbnail : PLACEHOLDER_IMAGE }} 
                  style={styles.seriesThumb} 
                />
                {/* Advanced Gradient Overlay for legibility */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
                <View style={styles.seriesBottomShadow} />
                
                <View style={styles.seriesOverlay}>
                  <View style={styles.seriesBadge}>
                    <Ionicons name="layers" size={10} color={Tokens.colors.primary} />
                    <Text style={styles.seriesCountText}>{item.count} VIDEOS</Text>
                  </View>
                  <Text style={styles.seriesTitle} numberOfLines={2}>{item.title}</Text>
                </View>

                {/* Decorative border light */}
                <View style={styles.seriesGloss} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 4. Spotify Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SPOTIFY</Text>
          </View>
          <View style={styles.spotifyGrid}>
            {SPOTIFY_LINKS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.spotifyCard}
                activeOpacity={0.86}
                onPress={() => openSpotifyURL(item.url)}
              >
                <View style={styles.spotifyIconShell}>
                  <Ionicons name={item.icon} size={22} color={Tokens.colors.primary} />
                </View>
                <View style={styles.spotifyInfo}>
                  <Text style={styles.spotifyTitle}>{item.title}</Text>
                  <Text style={styles.spotifySubtitle}>{item.subtitle}</Text>
                </View>
                <View style={styles.spotifyAction}>
                  <Text style={styles.spotifyLabel}>Spotify</Text>
                  <Ionicons name="open-outline" size={15} color={Tokens.colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 80,
  },
  section: {
    paddingHorizontal: Tokens.spacing.screenPadding,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 11,
    color: Tokens.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loading: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  error: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 223, 223, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.2)',
  },
  retryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    color: Tokens.colors.primary,
    letterSpacing: 1.5,
  },

  // Live Card
  liveCard: {
    height: 220,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  liveCardActive: {
    borderColor: Tokens.colors.primary + '40',
  },
  liveOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  liveTitle: {
    fontFamily: 'HUMANE-Bold',
    fontSize: 48,
    color: Tokens.colors.textPrimary,
    textTransform: 'uppercase',
    lineHeight: 44,
    marginBottom: 8,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveTime: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    color: Tokens.colors.primary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeLive: {
    backgroundColor: Tokens.colors.error,
  },
  badgeUpcoming: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },

  // Latest Grid
  latestGrid: {
    gap: 20,
  },
  videoCard: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  videoThumbContainer: {
    width: 124,
    height: 70,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    flex: 1,
    gap: 4,
  },
  videoTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: Tokens.colors.textPrimary,
    lineHeight: 20,
  },
  videoMeta: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1,
  },

  // Spotify
  spotifyGrid: {
    gap: 14,
  },
  spotifyCard: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.16)',
  },
  spotifyIconShell: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 223, 223, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.2)',
  },
  spotifyInfo: {
    flex: 1,
    gap: 4,
  },
  spotifyTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: Tokens.colors.textPrimary,
    lineHeight: 20,
  },
  spotifySubtitle: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.52)',
    lineHeight: 17,
  },
  spotifyAction: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  spotifyLabel: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 9,
    color: Tokens.colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Series Scroll
  seriesScroll: {
    gap: 16,
    paddingLeft: 0,
    paddingRight: Tokens.spacing.screenPadding,
  },
  seriesCard: {
    width: 280,
    height: 157, // Cinematic 16:9
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 223, 223, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  seriesThumb: {
    ...StyleSheet.absoluteFillObject,
  },
  seriesBottomShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderBottomWidth: 120,
    borderBottomColor: 'rgba(0,0,0,0.85)',
    position: 'absolute',
    bottom: 0,
  },
  seriesOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
  },
  seriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  seriesCountText: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 10,
    color: Tokens.colors.primary,
    letterSpacing: 1,
  },
  seriesTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    color: '#FFF',
    lineHeight: 22,
  },
  seriesGloss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 32,
  },
})
