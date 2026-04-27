import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../src/shared/components/layout/Screen'
import { AppHeader } from '../../src/shared/components/ui/AppHeader'
import { Tokens } from '../../src/shared/constants/tokens'
import { Ionicons } from '@expo/vector-icons'
import { BIBLE_BOOKS, getDailyReading, getBookById } from '../../src/features/bible/repository'
import { useBibleStore } from '../../src/features/bible/store'
import { useState } from 'react'
import { Modal, TextInput, Pressable, Platform, KeyboardAvoidingView, StatusBar } from 'react-native'
import { parseBibleReference } from '../../src/features/bible/utils/referenceParser'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function BibleHomeScreen({ showHomeButton = true }: { showHomeButton?: boolean }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const HEADER_HEIGHT = insets.top + 140 // Defined height for header area
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false)
  const [quickSearchText, setQuickSearchText] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)

  const daily = getDailyReading()
  const dailyBook = getBookById(daily.bookId)
  
  const isDailyRead = useBibleStore(state => state.isRead(daily.bookId, daily.chapter))
  const recentReferences = useBibleStore(state => state.recentReferences || [])
  const annotations = useBibleStore(state => state.annotations || {})
  const verseLists = useBibleStore(state => state.verseLists || [])
  
  const favorites = Object.values(annotations)
    .filter(a => a.favorite)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8) 

  const handleQuickSearch = () => {
    if (!quickSearchText.trim()) return

    const parsed = parseBibleReference(quickSearchText)
    if (parsed) {
      setIsSearchModalVisible(false)
      setQuickSearchText('')
      setSearchError(null)
      router.push({
        pathname: '/bible/reader',
        params: { 
          bookId: parsed.bookId, 
          chapter: parsed.chapter, 
          verse: parsed.verse 
        }
      })
    } else {
      setSearchError('Referencia no encontrada. Prueba con "Juan 3:16" o "Gen 1"')
    }
  }

  return (
    <Screen style={{ paddingTop: 0 }}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.headerWrapper, { height: HEADER_HEIGHT, paddingTop: insets.top }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <AppHeader 
          variant="screen" 
          title="BIBLIA" 
          subtitle="Tu santuario para la Palabra." 
          leftAction={
            showHomeButton ? (
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => router.replace('/(tabs)')}
              >
                <Ionicons name="home-outline" size={18} color={Tokens.colors.primary} />
              </TouchableOpacity>
            ) : undefined
          }
          rightAction={
            <TouchableOpacity 
              style={styles.headerActionBtn} 
              onPress={() => setIsSearchModalVisible(true)}
            >
              <Ionicons name="search-outline" size={18} color={Tokens.colors.primary} />
            </TouchableOpacity>
          }
        />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.container, 
          { paddingTop: HEADER_HEIGHT + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capítulo del Día</Text>
          <TouchableOpacity 
            style={[styles.dailyCard, isDailyRead && styles.dailyCardCompleted]}
            activeOpacity={0.9}
            onPress={() => router.push({
              pathname: '/bible/reader',
              params: { bookId: daily.bookId, chapter: daily.chapter }
            })}
          >
            <View style={styles.dailyOverlay} />
            <View style={styles.dailyInfo}>
              <View style={styles.dailyTextContainer}>
                <Text style={styles.dailyTag}>PASAJE RECOMENDADO</Text>
                <Text style={styles.dailyRef} numberOfLines={2}>
                  {dailyBook?.name} {daily.chapter}
                </Text>
                <Text style={styles.dailyGoal}>Continúa tu crecimiento espiritual hoy</Text>
              </View>
              {isDailyRead ? (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={32} color={Tokens.colors.primary} />
                </View>
              ) : (
                <View style={styles.dailyGoBtn}>
                  <Ionicons name="chevron-forward" size={24} color="#000" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent History */}
        {recentReferences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continuar Leyendo</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recentReferences.map((ref, index) => (
                <TouchableOpacity 
                  key={`${ref.bookId}-${ref.chapter}-${ref.verse}-${index}`}
                  style={styles.recentCard}
                  onPress={() => router.push({
                    pathname: '/bible/reader',
                    params: { bookId: ref.bookId, chapter: ref.chapter, verse: ref.verse }
                  })}
                >
                  <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
                  <View style={styles.recentIcon}>
                    <Ionicons name="time-outline" size={14} color={Tokens.colors.primary} />
                  </View>
                  <Text style={styles.recentRef} numberOfLines={1}>
                    {ref.bookName} {ref.chapter}{ref.verse ? `:${ref.verse}` : ''}
                  </Text>
                  <Text style={styles.recentTime}>Lectura reciente</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tus Favoritos</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {favorites.map((fav, index) => {
                const book = getBookById(fav.bookId)
                return (
                  <TouchableOpacity 
                    key={`${fav.bookId}-${fav.chapter}-${fav.verseNumber}-${index}`}
                    style={styles.favoriteCard}
                    onPress={() => router.push({
                      pathname: '/bible/reader',
                      params: { bookId: fav.bookId, chapter: fav.chapter, verse: fav.verseNumber }
                    })}
                  >
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                    <Ionicons name="heart" size={14} color={Tokens.colors.primary} style={{ marginBottom: 6 }} />
                    <Text style={styles.favoriteRef} numberOfLines={1}>{book?.name} {fav.chapter}:{fav.verseNumber}</Text>
                    <Text style={styles.favoriteLabel}>Versículo guardado</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* Personal Library Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu Biblioteca</Text>
          <TouchableOpacity 
            style={styles.savedCard}
            activeOpacity={0.8}
            onPress={() => router.push('/bible/saved')}
          >
            <View style={styles.savedIcon}>
              <Ionicons name="bookmark" size={20} color={Tokens.colors.primary} />
            </View>
            <View style={styles.savedTextContent}>
              <Text style={styles.savedTitle}>Mis Notas y Marcadores</Text>
              <Text style={styles.savedSubtitle}>Repasa tus reflexiones personales</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Tokens.colors.textMuted} />
          </TouchableOpacity>
          {verseLists.length > 0 && (
            <View style={styles.verseListsBlock}>
              {verseLists.map((list) => (
                <View key={list.id} style={styles.verseListCard}>
                  <Ionicons name="list-outline" size={18} color={Tokens.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verseListTitle}>{list.name}</Text>
                    <Text style={styles.verseListMeta}>{list.items.length} versículos guardados</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Books List */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>Libros de la Biblia</Text>
          <View style={styles.booksGrid}>
            {BIBLE_BOOKS.map(book => (
              <TouchableOpacity 
                key={book.id} 
                style={styles.bookItem}
                activeOpacity={0.7}
                onPress={() => router.push({
                  pathname: '/bible/book/[id]',
                  params: { id: book.id }
                })}
              >
                <View style={[
                  styles.bookIcon, 
                  { backgroundColor: book.testament === 'Antiguo' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(168, 85, 247, 0.08)' }
                ]}>
                  <Text style={[
                     styles.bookInitial,
                     { color: book.testament === 'Antiguo' ? Tokens.colors.spiritual.sky : Tokens.colors.spiritual.lavender }
                  ]}>{book.name[0]}</Text>
                </View>
                <View style={styles.bookText}>
                  <Text style={styles.bookName}>{book.name}</Text>
                  <Text style={styles.bookMeta}>{book.chapters} capítulos • {book.testament}</Text>
                </View>
                <View style={styles.bookActionIcon}>
                  <Ionicons name="chevron-forward" size={16} color={Tokens.colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Quick Search Modal */}
      <Modal
        visible={isSearchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => {
              setIsSearchModalVisible(false)
              setSearchError(null)
            }}
          >
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            
            <Pressable style={styles.searchModalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.searchModalHeader}>
                <Text style={styles.searchModalTitle}>Búsqueda Rápida</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsSearchModalVisible(false)}>
                  <Ionicons name="close" size={20} color={Tokens.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchInputWrapper}>
                <Ionicons name="book-outline" size={20} color={Tokens.colors.primary} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Ej: Juan 3:16 o Salmos 23"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  autoFocus
                  value={quickSearchText}
                  onChangeText={(text) => {
                    setQuickSearchText(text)
                    if (searchError) setSearchError(null)
                  }}
                  onSubmitEditing={handleQuickSearch}
                  returnKeyType="search"
                />
              </View>

              {searchError && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={Tokens.colors.error} />
                  <Text style={styles.errorText}>{searchError}</Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.searchBtn}
                activeOpacity={0.8}
                onPress={handleQuickSearch}
              >
                <Text style={styles.searchBtnText}>Ir al pasaje</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  container: {
    paddingHorizontal: Tokens.spacing.screenPadding,
  },
  section: {
    marginBottom: Tokens.spacing.sectionGap,
  },
  sectionTitle: {
    fontFamily: Tokens.typography.fontFamily.semiBold,
    fontSize: 16,
    color: Tokens.colors.textPrimary,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  dailyCard: {
    backgroundColor: Tokens.colors.secondary,
    borderRadius: Tokens.radius.cardLarge,
    padding: Tokens.spacing.cardPadding,
    borderWidth: 1,
    borderColor: Tokens.colors.outline,
    overflow: 'hidden',
    minHeight: 200,
    justifyContent: 'flex-end',
  },
  dailyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Tokens.colors.primary,
    opacity: 0.05,
  },
  dailyCardCompleted: {
    borderColor: Tokens.colors.primaryMuted,
  },
  dailyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  dailyTextContainer: {
    flex: 1,
  },
  dailyTag: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 10,
    color: Tokens.colors.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  dailyRef: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 32,
    color: Tokens.colors.textPrimary,
    lineHeight: 34,
    marginBottom: 10,
    marginTop: 4,
  },
  dailyGoal: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 13,
    color: Tokens.colors.textSecondary,
    maxWidth: '80%',
  },
  dailyGoBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Tokens.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  completedBadge: {
    padding: 4,
  },
  horizontalScroll: {
    paddingRight: Tokens.spacing.screenPadding,
    gap: 12,
  },
  recentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Tokens.radius.card,
    padding: 16,
    width: 170,
    borderWidth: 1,
    borderColor: Tokens.colors.outlineVariant,
    overflow: 'hidden',
  },
  recentIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 223, 223, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentRef: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 15,
    color: Tokens.colors.textPrimary,
    marginBottom: 4,
  },
  recentTime: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 11,
    color: Tokens.colors.textMuted,
  },
  favoriteCard: {
    backgroundColor: 'rgba(15, 223, 223, 0.03)',
    borderRadius: Tokens.radius.card,
    padding: 16,
    width: 170,
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.15)',
    overflow: 'hidden',
  },
  favoriteRef: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 15,
    color: Tokens.colors.textPrimary,
    marginBottom: 4,
  },
  favoriteLabel: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 11,
    color: Tokens.colors.textMuted,
  },
  savedCard: {
    backgroundColor: Tokens.colors.surfaceLow,
    borderRadius: Tokens.radius.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Tokens.colors.outlineVariant,
  },
  verseListsBlock: {
    gap: 10,
    marginTop: 12,
  },
  verseListCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: Tokens.colors.outlineVariant,
  },
  verseListTitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 14,
    color: Tokens.colors.textPrimary,
  },
  verseListMeta: {
    marginTop: 3,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 12,
    color: Tokens.colors.textMuted,
  },
  savedIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Tokens.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedTextContent: {
    flex: 1,
  },
  savedTitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 16,
    color: Tokens.colors.textPrimary,
    marginBottom: 2,
  },
  savedSubtitle: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 13,
    color: Tokens.colors.textMuted,
  },
  booksGrid: {
    backgroundColor: Tokens.colors.surfaceLow,
    borderRadius: Tokens.radius.cardLarge,
    borderWidth: 1,
    borderColor: Tokens.colors.outlineVariant,
    overflow: 'hidden',
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.colors.outlineVariant,
  },
  bookIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bookInitial: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 20,
  },
  bookText: {
    flex: 1,
  },
  bookName: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 16,
    color: Tokens.colors.textPrimary,
    marginBottom: 4,
  },
  bookMeta: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 12,
    color: Tokens.colors.textMuted,
  },
  bookActionIcon: {
    padding: 4,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  searchModalContent: {
    backgroundColor: 'rgba(22, 22, 29, 0.95)',
    borderRadius: Tokens.radius.cardLarge,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 30,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  searchModalTitle: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 32,
    color: Tokens.colors.textPrimary,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 64,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSearchInput: {
    flex: 1,
    color: Tokens.colors.textPrimary,
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 17,
  },
  searchBtn: {
    backgroundColor: Tokens.colors.primary,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    shadowColor: Tokens.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  searchBtnText: {
    color: '#000',
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 17,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 8,
  },
  errorText: {
    color: Tokens.colors.error,
    fontSize: 14,
    fontFamily: Tokens.typography.fontFamily.medium,
  },
})
