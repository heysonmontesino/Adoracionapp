import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Platform, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../src/shared/components/layout/Screen'
import { Tokens } from '../../src/shared/constants/tokens'
import { Ionicons } from '@expo/vector-icons'
import { useBibleStore } from '../../src/features/bible/store'
import { getBookById, getVerseText } from '../../src/features/bible/repository'
import { useEffect, useState, useMemo } from 'react'
import { VerseAnnotation } from '../../src/features/bible/types'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type EnrichedAnnotation = VerseAnnotation & {
  bookName: string
  verseText: string
}

export default function SavedBibleNotesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const annotations = useBibleStore(state => state.annotations || {})
  const [enriched, setEnriched] = useState<EnrichedAnnotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and sort annotations: only those with some content/favorite/highlight
  const relevantAnnotations = useMemo(() => {
    return Object.values(annotations)
      .filter(a => a.favorite || a.highlightColor || (a.note && a.note.trim().length > 0))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [annotations])

  useEffect(() => {
    async function enrich() {
      setLoading(true)
      const results: EnrichedAnnotation[] = []
      
      for (const annotation of relevantAnnotations) {
        const book = getBookById(annotation.bookId)
        const text = await getVerseText(annotation.bookId, annotation.chapter, annotation.verseNumber)
        
        results.push({
          ...annotation,
          bookName: book?.name || 'Libro',
          verseText: text
        })
      }
      
      setEnriched(results)
      setLoading(false)
    }

    enrich()
  }, [relevantAnnotations])

  const filteredEnriched = useMemo(() => {
    if (!searchQuery.trim()) return enriched
    
    const query = searchQuery.toLowerCase()
    return enriched.filter(item => 
      item.bookName.toLowerCase().includes(query) ||
      item.verseText.toLowerCase().includes(query) ||
      (item.note && item.note.toLowerCase().includes(query)) ||
      `${item.chapter}:${item.verseNumber}`.includes(query)
    )
  }, [enriched, searchQuery])

  const renderItem = ({ item }: { item: EnrichedAnnotation }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push({
        pathname: '/bible/reader',
        params: { bookId: item.bookId, chapter: item.chapter, verse: item.verseNumber }
      })}
    >
      <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.cardHeader}>
        <View style={styles.referenceContainer}>
          <Text style={styles.reference}>{item.bookName} {item.chapter}:{item.verseNumber}</Text>
          <Text style={styles.date}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.indicators}>
          {item.favorite && (
            <View style={styles.indicatorBadge}>
              <Ionicons name="heart" size={12} color={Tokens.colors.primary} />
            </View>
          )}
          {item.highlightColor && (
            <View style={[styles.colorBadge, { backgroundColor: item.highlightColor }]} />
          )}
        </View>
      </View>

      <View style={styles.verseExtractContainer}>
        <Text style={styles.verseExtract} numberOfLines={3}>
          {item.verseText}
        </Text>
      </View>

      {item.note && (
        <View style={styles.noteContainer}>
          <View style={styles.noteLine} />
          <View style={styles.noteContent}>
            <Text style={styles.noteLabel}>REFLEXIÓN</Text>
            <Text style={styles.noteText} numberOfLines={4}>{item.note}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <Screen style={{ paddingTop: 0 }}>
      <StatusBar barStyle="light-content" />
      
      <BlurView intensity={45} tint="dark" style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={Tokens.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>BIBLIOTECA</Text>
            <Text style={styles.headerSubtitle}>Tus tesoros espirituales</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Tokens.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar en tus notas..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={Tokens.colors.primary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={Tokens.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BlurView>

      <FlatList
        data={filteredEnriched}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.bookId}-${item.chapter}-${item.verseNumber}`}
        contentContainerStyle={[
          styles.listContent, 
          { paddingTop: insets.top + 180, paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Tokens.colors.primary} size="large" />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons 
                  name={searchQuery ? "search-outline" : "bookmark-outline"} 
                  size={48} 
                  color={Tokens.colors.primary} 
                />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Sin resultados' : 'Aún no hay tesoros'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? `No encontramos nada que coincida con "${searchQuery}"`
                  : 'Resalta versículos o guarda favoritos mientras lees la Biblia para verlos aquí.'
                }
              </Text>
            </View>
          )
        }
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 24,
    color: Tokens.colors.textPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 10,
    color: Tokens.colors.primary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
    opacity: 0.8,
  },
  headerRight: {
    width: 44,
  },
  searchSection: {
    paddingHorizontal: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    color: Tokens.colors.textPrimary,
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  referenceContainer: {
    flex: 1,
  },
  reference: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 17,
    color: Tokens.colors.textPrimary,
    letterSpacing: -0.5,
  },
  date: {
    fontFamily: Tokens.typography.fontFamily.medium,
    fontSize: 11,
    color: Tokens.colors.textMuted,
    marginTop: 2,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  colorBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  verseExtractContainer: {
    marginBottom: 16,
  },
  verseExtract: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 16,
    color: Tokens.colors.textSecondary,
    lineHeight: 24,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  noteContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  noteLine: {
    width: 3,
    backgroundColor: Tokens.colors.primary,
    borderRadius: 1.5,
    opacity: 0.5,
  },
  noteContent: {
    flex: 1,
  },
  noteLabel: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 10,
    color: Tokens.colors.primary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  noteText: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 15,
    color: Tokens.colors.textPrimary,
    lineHeight: 22,
  },
  center: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 28,
    color: Tokens.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 16,
    color: Tokens.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
})

