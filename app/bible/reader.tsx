import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Pressable, Platform, Alert, Share } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen } from '../../src/shared/components/layout/Screen'
import { Tokens } from '../../src/shared/constants/tokens'
import { Ionicons } from '@expo/vector-icons'
import { getBookById, fetchChapterContent } from '../../src/features/bible/repository'
import { useBibleStore } from '../../src/features/bible/store'
import { useEffect, useState, useRef } from 'react'
import { ChapterContent, VerseAnnotation, FontSizePreference } from '../../src/features/bible/types'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { copyVerseToClipboard, shareVerse } from '../../src/features/bible/utils/shareVerse'
import { BibleAiInsightSheet } from '../../src/features/bible-ai/BibleAiInsightSheet'
import { getBibleAiInsight } from '../../src/features/bible-ai/bibleAiService'
import type { BibleAiInsight, BibleAiInsightType } from '../../src/features/bible-ai/types'

const FONT_SIZE_MAP = {
  small: { verse: 17, number: 12, line: 28 },
  normal: { verse: 20, number: 13, line: 36 },
  large: { verse: 24, number: 15, line: 42 },
  extraLarge: { verse: 30, number: 18, line: 52 },
}

const HIGHLIGHT_COLORS = [
  { id: 'yellow', value: 'rgba(253, 224, 71, 0.25)' },
  { id: 'blue', value: 'rgba(96, 165, 250, 0.25)' },
  { id: 'green', value: 'rgba(74, 222, 128, 0.25)' },
  { id: 'purple', value: 'rgba(167, 139, 250, 0.25)' },
]

export default function BibleReaderScreen() {
  const { bookId, chapter, verse } = useLocalSearchParams<{ bookId: string; chapter: string; verse?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [content, setContent] = useState<ChapterContent | null>(null)
  const [loading, setLoading] = useState(true)
  const scrollViewRef = useRef<ScrollView>(null)
  const versePositions = useRef<Record<number, number>>({})
  
  // Annotation State
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [selectedVerses, setSelectedVerses] = useState<number[]>([])
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isListModalVisible, setIsListModalVisible] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [tempAnnotation, setTempAnnotation] = useState<Partial<VerseAnnotation>>({})
  
  const book = getBookById(bookId)
  const chapterNumber = parseInt(chapter)
  
  // Store logic
  const markAsRead = useBibleStore(state => state.markAsRead)
  const isRead = useBibleStore(state => state.isRead)
  const saveAnnotation = useBibleStore(state => state.saveAnnotation)
  const annotations = useBibleStore(state => state.annotations || {})
  const hasHydrated = useBibleStore(state => state._hasHydrated)
  const fontSizePref = useBibleStore(state => state.fontSize || 'normal')
  const setFontSize = useBibleStore(state => state.setFontSize)
  const verseLists = useBibleStore(state => state.verseLists || [])
  const createVerseList = useBibleStore(state => state.createVerseList)
  const addVersesToList = useBibleStore(state => state.addVersesToList)

  const [isFontModalVisible, setIsFontModalVisible] = useState(false)

  // AI Insight State
  const [isAiSheetVisible, setIsAiSheetVisible] = useState(false)
  const [aiInsight, setAiInsight] = useState<BibleAiInsight | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const completed = isRead(bookId, chapterNumber)
  const addRecentReference = useBibleStore(state => state.addRecentReference)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const text = await fetchChapterContent(bookId, chapterNumber)
        setContent(text)
        
        if (book) {
          addRecentReference({
            bookId,
            chapter: chapterNumber,
            verse: verse ? parseInt(verse) : undefined,
            bookName: book.name,
            timestamp: new Date().toISOString()
          })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookId, chapterNumber, verse, book])

  useEffect(() => {
    if (!loading && verse && content) {
      const vNum = parseInt(verse)
      const timer = setTimeout(() => {
        const y = versePositions.current[vNum]
        if (y !== undefined && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: y - 120, animated: true })
          setHighlightedVerse(vNum)
          setTimeout(() => setHighlightedVerse((current) => current === vNum ? null : current), 2200)
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [loading, verse, content])

  const handleVersePress = (verseNumber: number) => {
    if (selectedVerses.length > 0) {
      toggleVerseSelection(verseNumber)
      return
    }

    const key = `${bookId}-${chapterNumber}-${verseNumber}`
    const existing = annotations[key]
    
    setSelectedVerse(verseNumber)
    setTempAnnotation(existing ? { ...existing } : {
      bookId,
      chapter: chapterNumber,
      verseNumber,
      favorite: false,
      highlightColor: null,
      note: null,
    })
    setIsModalVisible(true)
  }

  const toggleVerseSelection = (verseNumber: number) => {
    setSelectedVerses((current) =>
      current.includes(verseNumber)
        ? current.filter((item) => item !== verseNumber)
        : [...current, verseNumber].sort((a, b) => a - b)
    )
    setIsModalVisible(false)
  }

  const selectedVerseObjects = () => {
    if (!content) return []
    return selectedVerses
      .map((verseNumber) => content.verses.find((item) => item.number === verseNumber))
      .filter(Boolean) as NonNullable<typeof content>['verses']
  }

  const handleSaveAnnotation = () => {
    if (selectedVerse && tempAnnotation) {
      const finalAnnotation: VerseAnnotation = {
        bookId: tempAnnotation.bookId || bookId,
        chapter: tempAnnotation.chapter || chapterNumber,
        verseNumber: tempAnnotation.verseNumber || selectedVerse,
        favorite: !!tempAnnotation.favorite,
        highlightColor: tempAnnotation.highlightColor || null,
        note: tempAnnotation.note || null,
        updatedAt: new Date().toISOString()
      }
      saveAnnotation(finalAnnotation)
      setIsModalVisible(false)
      setSelectedVerse(null)
    }
  }

  const handleCopy = async () => {
    if (!book || !selectedVerse || !content) return
    const verseObj = content.verses.find(v => v.number === selectedVerse)
    if (!verseObj) return

    const success = await copyVerseToClipboard(
      verseObj.text,
      book.name,
      chapterNumber,
      selectedVerse
    )

    if (success) {
      setIsModalVisible(false)
      Alert.alert('Copiado', 'Versículo copiado al portapapeles.')
    }
  }

  const handleCopySelected = async () => {
    if (!book || !content || selectedVerses.length === 0) return
    const verses = selectedVerseObjects()
    const first = selectedVerses[0]
    const last = selectedVerses[selectedVerses.length - 1]
    const reference = first === last
      ? `${book.name} ${chapterNumber}:${first}`
      : `${book.name} ${chapterNumber}:${first}-${last}`
    const formatted = [
      verses.map((item) => `${item.number}. ${item.text.trim()}`).join('\n'),
      `— ${reference} (RVR1960)`,
      `adoracion://bible/reader?bookId=${bookId}&chapter=${chapterNumber}&verse=${first}`,
    ].join('\n')

    try {
      const Clipboard = require('expo-clipboard')
      if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
        await Clipboard.setStringAsync(formatted)
        setSelectedVerses([])
        Alert.alert('Copiado', 'Versículos copiados al portapapeles.')
      } else {
        Alert.alert('No disponible', 'No pudimos acceder al portapapeles en este momento.')
      }
    } catch (error) {
      console.error('[BibleReader] copy selected failed', error)
      Alert.alert('No disponible', 'No pudimos copiar los versículos en este momento.')
    }
  }

  const handleSaveSelectedToList = (listId?: string) => {
    if (!book || !content || selectedVerses.length === 0) return
    const trimmedName = newListName.trim()
    const targetListId = listId ?? (trimmedName ? createVerseList(trimmedName) : null)
    if (!targetListId) {
      Alert.alert('Nombre requerido', 'Ponle un nombre a tu lista.')
      return
    }

    addVersesToList(
      targetListId,
      selectedVerseObjects().map((item) => ({
        bookId,
        chapter: chapterNumber,
        verseNumber: item.number,
        text: item.text,
        bookName: book.name,
        addedAt: new Date().toISOString(),
      })),
    )
    setSelectedVerses([])
    setNewListName('')
    setIsListModalVisible(false)
    Alert.alert('Guardado', 'Versículos agregados a tu lista.')
  }

  const handleShare = async () => {
    if (!book || !selectedVerse || !content) return
    const verseObj = content.verses.find(v => v.number === selectedVerse)
    if (!verseObj) return

    await shareVerse(
      verseObj.text,
      book.name,
      chapterNumber,
      selectedVerse
    )
  }

  const handleAiInsight = async (insightType: BibleAiInsightType) => {
    if (!book || !selectedVerse || !content) return
    const verseObj = content.verses.find(v => v.number === selectedVerse)
    if (!verseObj) return

    setIsModalVisible(false)
    setIsAiSheetVisible(true)
    setAiLoading(true)
    setAiError(null)

    // Build surrounding context: 5 verses before and after
    const contextRadius = 5
    const startIdx = Math.max(0, selectedVerse - contextRadius - 1)
    const endIdx = Math.min(content.verses.length - 1, selectedVerse + contextRadius - 1)
    const surroundingVerses = content.verses.slice(startIdx, endIdx + 1)
    const surroundingText = surroundingVerses
      .map(v => `${v.number}. ${v.text}`)
      .join('\n')

    try {
      const insight = await getBibleAiInsight({
        book: book.name,
        chapter: chapterNumber,
        verseStart: selectedVerse,
        verseText: verseObj.text,
        surroundingText,
        bibleVersion: 'RVR1960',
        insightType,
        language: 'es',
      })
      setAiInsight(insight)
    } catch (error) {
      console.error('[BibleReader] AI insight failed', error)
      setAiError('No pudimos obtener la explicación en este momento. Intenta de nuevo.')
    } finally {
      setAiLoading(false)
    }
  }

  if (!book) return null

  if (!hasHydrated && loading) return (
    <Screen><View style={styles.center}><ActivityIndicator color={Tokens.colors.primary} /></View></Screen>
  )

  return (
    <Screen style={{ paddingTop: 0 }}>
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
            <Text style={styles.bookName}>{book.name}</Text>
            <Text style={styles.chapterLabel}>Capítulo {chapterNumber}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIcon} 
              activeOpacity={0.7}
              onPress={() => setIsFontModalVisible(true)}
            >
              <Text style={styles.aaText}>Aa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Tokens.colors.primary} size="large" />
          </View>
        ) : (
          <View style={styles.bibleTextContainer}>
            <View style={styles.editorialSpacer} />
            {content?.verses.map((verse, index) => {
              const annotationKey = `${bookId}-${chapterNumber}-${verse.number}`
              const annotation = annotations[annotationKey]
              const color = annotation?.highlightColor
              
              return (
                <TouchableOpacity 
                  key={verse.number} 
                  activeOpacity={0.6}
                  onPress={() => handleVersePress(verse.number)}
                  onLongPress={() => toggleVerseSelection(verse.number)}
                  onLayout={(event) => {
                    versePositions.current[verse.number] = event.nativeEvent.layout.y
                  }}
                  style={[
                    styles.verseRow, 
                    color ? { backgroundColor: color, borderRadius: 12 } : null,
                    highlightedVerse === verse.number ? styles.verseRowSearchHighlight : null,
                    selectedVerses.includes(verse.number) ? styles.verseRowSelected : null,
                  ]}
                >
                  <Text style={[styles.verseFullText, { lineHeight: FONT_SIZE_MAP[fontSizePref].line }]}>
                    <Text style={[styles.verseNumber, { fontSize: FONT_SIZE_MAP[fontSizePref].number }]}>{verse.number} </Text>
                    <Text style={[styles.verseText, { fontSize: FONT_SIZE_MAP[fontSizePref].verse, lineHeight: FONT_SIZE_MAP[fontSizePref].line }]}>{verse.text}</Text>
                  </Text>
                  {(annotation?.favorite || annotation?.note) && (
                    <View style={styles.indicators}>
                      {annotation?.favorite && (
                        <View style={styles.indicatorBadge}>
                          <Ionicons name="heart" size={10} color={Tokens.colors.primary} />
                        </View>
                      )}
                      {annotation?.note && (
                        <View style={[styles.indicatorBadge, { backgroundColor: Tokens.colors.surfaceHigh }]}>
                          <Ionicons name="document-text" size={10} color={Tokens.colors.textSecondary} />
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}

            <TouchableOpacity 
              style={[styles.completeButton, completed && styles.completeButtonActive]}
              onPress={() => markAsRead(bookId, chapterNumber)}
              disabled={completed}
              activeOpacity={0.8}
            >
              <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
              <Ionicons 
                name={completed ? "checkmark-circle" : "checkmark"} 
                size={22} 
                color={completed ? Tokens.colors.primary : Tokens.colors.textSecondary} 
              />
              <Text style={[styles.completeButtonText, completed && styles.completeButtonTextActive]}>
                {completed ? 'Capítulo completado' : 'Finalizar lectura de hoy'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.footerSpacer} />
          </View>
        )}
      </ScrollView>

      {selectedVerses.length > 0 && (
        <View style={[styles.selectionBar, { bottom: insets.bottom + 18 }]}>
          <Text style={styles.selectionText}>{selectedVerses.length} seleccionados</Text>
          <TouchableOpacity style={styles.selectionAction} onPress={handleCopySelected}>
            <Ionicons name="copy-outline" size={16} color={Tokens.colors.primary} />
            <Text style={styles.selectionActionText}>Copiar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionAction} onPress={() => setIsListModalVisible(true)}>
            <Ionicons name="list-outline" size={16} color={Tokens.colors.primary} />
            <Text style={styles.selectionActionText}>Guardar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionClose} onPress={() => setSelectedVerses([])}>
            <Ionicons name="close" size={18} color={Tokens.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Annotation Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsModalVisible(false)}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
          
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBox}>
                <Text style={styles.modalTitle}>{book.name} {chapterNumber}:{selectedVerse}</Text>
                <Text style={styles.modalSubtitle}>REINA-VALERA 1960</Text>
              </View>
              <TouchableOpacity 
                style={[styles.favoriteToggle, tempAnnotation.favorite && styles.favoriteToggleActive]}
                onPress={() => setTempAnnotation(prev => ({ ...prev, favorite: !prev.favorite }))}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={tempAnnotation.favorite ? "heart" : "heart-outline"} 
                  size={26} 
                  color={tempAnnotation.favorite ? Tokens.colors.primary : Tokens.colors.textPrimary} 
                />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Resaltar versículo</Text>
                <View style={styles.colorPalette}>
                  <TouchableOpacity 
                    style={[styles.colorOption, !tempAnnotation.highlightColor && styles.colorOptionActive]} 
                    onPress={() => setTempAnnotation(prev => ({ ...prev, highlightColor: null }))}
                  >
                    <Ionicons name="close" size={24} color={Tokens.colors.textPrimary} />
                  </TouchableOpacity>
                  {HIGHLIGHT_COLORS.map(color => (
                    <TouchableOpacity 
                      key={color.id}
                      style={[
                        styles.colorOption, 
                        { backgroundColor: color.value }, 
                        tempAnnotation.highlightColor === color.value && styles.colorOptionActive
                      ]}
                      onPress={() => setTempAnnotation(prev => ({ ...prev, highlightColor: color.value }))}
                    >
                      {tempAnnotation.highlightColor === color.value && (
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Acciones</Text>
                <View style={styles.shareActions}>
                  <TouchableOpacity 
                    style={styles.shareActionBtn}
                    onPress={handleCopy}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={20} color={Tokens.colors.textPrimary} />
                    <Text style={styles.shareActionText}>Copiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.shareActionBtn}
                    onPress={handleShare}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={20} color={Tokens.colors.textPrimary} />
                    <Text style={styles.shareActionText}>Compartir</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Explicación con IA</Text>
                <View style={styles.shareActions}>
                  <TouchableOpacity 
                    style={styles.aiActionBtn}
                    onPress={() => handleAiInsight('context')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="bulb-outline" size={20} color={Tokens.colors.primary} />
                    <Text style={styles.aiActionText}>Contexto IA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.aiActionBtn}
                    onPress={() => handleAiInsight('original_language')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="language-outline" size={20} color={Tokens.colors.primary} />
                    <Text style={styles.aiActionText}>Texto original IA</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Nota espiritual</Text>
                <View style={styles.noteInputContainer}>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Reflexiona sobre este versículo..."
                    placeholderTextColor={Tokens.colors.textMuted}
                    multiline
                    value={tempAnnotation.note || ''}
                    onChangeText={(text) => setTempAnnotation(prev => ({ ...prev, note: text }))}
                    selectionColor={Tokens.colors.primary}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setIsModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSaveAnnotation}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verse Lists Modal */}
      <Modal
        visible={isListModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsListModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsListModalVisible(false)}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
          <View style={styles.fontModalContent}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBox}>
                <Text style={styles.modalTitle}>Guardar en lista</Text>
                <Text style={styles.modalSubtitle}>{selectedVerses.length} VERSÍCULOS SELECCIONADOS</Text>
              </View>
            </View>

            {verseLists.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Listas existentes</Text>
                {verseLists.map((list) => (
                  <TouchableOpacity key={list.id} style={styles.listOption} onPress={() => handleSaveSelectedToList(list.id)}>
                    <View>
                      <Text style={styles.listOptionTitle}>{list.name}</Text>
                      <Text style={styles.listOptionMeta}>{list.items.length} versículos</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Tokens.colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Nueva lista</Text>
              <View style={styles.noteInputContainer}>
                <TextInput
                  style={[styles.noteInput, { minHeight: 56 }]}
                  placeholder="Ej: Promesas para orar"
                  placeholderTextColor={Tokens.colors.textMuted}
                  value={newListName}
                  onChangeText={setNewListName}
                  selectionColor={Tokens.colors.primary}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.doneBtn} onPress={() => handleSaveSelectedToList()}>
              <Text style={styles.doneBtnText}>Crear y guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Font Size Modal */}
      <Modal
        visible={isFontModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFontModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsFontModalVisible(false)}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
          
          <View style={styles.fontModalContent}>
            <View style={styles.modalDragHandle} />
            
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBox}>
                <Text style={styles.modalTitle}>Tipografía</Text>
                <Text style={styles.modalSubtitle}>AJUSTES DE LECTURA</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeModalBtn}
                onPress={() => setIsFontModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={Tokens.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Tamaño del texto</Text>
              <View style={styles.fontSizeOptions}>
                {(['small', 'normal', 'large', 'extraLarge'] as FontSizePreference[]).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.fontSizeOption,
                      fontSizePref === size && styles.fontSizeOptionActive
                    ]}
                    onPress={() => setFontSize(size)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.fontSizeLabel,
                      { fontSize: size === 'small' ? 14 : size === 'normal' ? 17 : size === 'large' ? 20 : 24 },
                      fontSizePref === size && { color: Tokens.colors.primary }
                    ]}>
                      A
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.fontSizeLabels}>
                <Text style={styles.sizeHint}>Pequeño</Text>
                <Text style={styles.sizeHint}>Extra Grande</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.doneBtn} 
              onPress={() => setIsFontModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Insight Sheet */}
      <BibleAiInsightSheet
        visible={isAiSheetVisible}
        onClose={() => {
          setIsAiSheetVisible(false)
          setAiInsight(null)
          setAiError(null)
        }}
        insight={aiInsight}
        loading={aiLoading}
        error={aiError}
      />

    </Screen>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  bookName: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 24,
    color: Tokens.colors.textPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  chapterLabel: {
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
    alignItems: 'flex-end',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 160,
    paddingHorizontal: 24,
  },
  bibleTextContainer: {
    maxWidth: 650,
    alignSelf: 'center',
    width: '100%',
  },
  editorialSpacer: {
    height: 20,
  },
  verseRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: -16,
    marginBottom: 4,
    flexDirection: 'column',
  },
  verseRowSearchHighlight: {
    backgroundColor: 'rgba(15, 223, 223, 0.16)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.35)',
  },
  verseRowSelected: {
    backgroundColor: 'rgba(15, 223, 223, 0.12)',
    borderRadius: 14,
  },
  verseFullText: {
    lineHeight: 36,
  },
  verseNumber: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 13,
    color: Tokens.colors.primary,
    opacity: 0.7,
  },
  verseText: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 20,
    color: Tokens.colors.textPrimary,
    lineHeight: 36,
    opacity: 0.95,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  indicatorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Tokens.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Tokens.colors.primary + '22',
  },
  completeButton: {
    marginTop: 80,
    height: 72,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  completeButtonActive: {
    borderColor: Tokens.colors.primary + '44',
    backgroundColor: Tokens.colors.primaryMuted,
  },
  completeButtonText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 17,
    color: Tokens.colors.textSecondary,
  },
  completeButtonTextActive: {
    color: Tokens.colors.primary,
  },
  footerSpacer: {
    height: 60,
  },
  selectionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 62,
    borderRadius: 22,
    backgroundColor: '#171426',
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  selectionText: {
    flex: 1,
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 12,
    color: Tokens.colors.textPrimary,
  },
  selectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 223, 223, 0.1)',
  },
  selectionActionText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 11,
    color: Tokens.colors.primary,
  },
  selectionClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#0D0D0D', // Solid dark base for modal
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  modalDragHandle: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
    marginBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  modalTitleBox: {
    flex: 1,
  },
  modalTitle: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 32,
    color: Tokens.colors.textPrimary,
    letterSpacing: 1,
  },
  modalSubtitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 11,
    color: Tokens.colors.primary,
    letterSpacing: 3,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  favoriteToggle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  favoriteToggleActive: {
    backgroundColor: Tokens.colors.primaryMuted,
    borderColor: Tokens.colors.primary + '33',
  },
  modalSection: {
    marginBottom: 32,
  },
  shareActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  shareActionText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 15,
    color: Tokens.colors.textPrimary,
  },
  modalLabel: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 13,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  colorPalette: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionActive: {
    borderColor: Tokens.colors.primary,
    transform: [{ scale: 1.1 }],
  },
  noteInputContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 150,
  },
  noteInput: {
    padding: 20,
    color: Tokens.colors.textPrimary,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 17,
    lineHeight: 26,
    textAlignVertical: 'top',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cancelBtnText: {
    color: Tokens.colors.textSecondary,
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 16,
  },
  saveBtn: {
    flex: 2,
    height: 64,
    backgroundColor: Tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: Tokens.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: {
    color: '#000',
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 17,
  },
  
  // Font Modal Styles
  aaText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 18,
    color: Tokens.colors.textSecondary,
    letterSpacing: -1,
  },
  fontModalContent: {
    backgroundColor: '#0D0D0D',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  fontSizeOptions: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 6,
    marginTop: 8,
  },
  fontSizeOption: {
    flex: 1,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  fontSizeOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fontSizeLabel: {
    fontFamily: Tokens.typography.fontFamily.bold,
    color: Tokens.colors.textSecondary,
  },
  fontSizeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  sizeHint: {
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 12,
    color: Tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeModalBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtn: {
    height: 64,
    backgroundColor: Tokens.colors.surfaceHigh,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  doneBtnText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 17,
    color: Tokens.colors.textPrimary,
  },
  listOption: {
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listOptionTitle: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 14,
    color: Tokens.colors.textPrimary,
  },
  listOptionMeta: {
    marginTop: 3,
    fontFamily: Tokens.typography.fontFamily.regular,
    fontSize: 12,
    color: Tokens.colors.textMuted,
  },
  aiActionBtn: {
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(15, 223, 223, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 223, 223, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  aiActionText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 13,
    color: Tokens.colors.primary,
    letterSpacing: 0.3,
  },
})
