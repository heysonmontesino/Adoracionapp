import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen } from '../../../src/shared/components/layout/Screen'
import { Tokens } from '../../../src/shared/constants/tokens'
import { Ionicons } from '@expo/vector-icons'
import { getBookById } from '../../../src/features/bible/repository'
import { useBibleStore } from '../../../src/features/bible/store'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function BookChaptersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const book = getBookById(id)
  const isRead = useBibleStore(state => state.isRead)

  if (!book) return null

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1)

  return (
    <Screen style={{ paddingTop: 0 }}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={Tokens.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{book.name.toUpperCase()}</Text>
      </View>

      <FlatList
        data={chapters}
        keyExtractor={(item) => item.toString()}
        numColumns={5}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + Tokens.sizing.headerHeight + 20 }
        ]}
        columnWrapperStyle={styles.row}
        renderItem={({ item: chapter }) => {
          const completed = isRead(book.id, chapter)
          return (
            <TouchableOpacity 
              style={[styles.chapterItem, completed && styles.chapterItemCompleted]}
              onPress={() => router.push({
                pathname: '/bible/reader',
                params: { bookId: book.id, chapter }
              })}
            >
              <Text style={[styles.chapterText, completed && styles.chapterTextCompleted]}>
                {chapter}
              </Text>
            </TouchableOpacity>
          )
        }}
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
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: Tokens.sizing.headerHeight + 40, // Adjust for inset
    gap: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontFamily: Tokens.typography.fontFamily.display,
    fontSize: 32,
    color: Tokens.colors.textPrimary,
    letterSpacing: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  chapterItem: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterItemCompleted: {
    backgroundColor: 'rgba(15, 223, 223, 0.08)',
    borderColor: 'rgba(15, 223, 223, 0.2)',
  },
  chapterText: {
    fontFamily: Tokens.typography.fontFamily.bold,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  chapterTextCompleted: {
    color: Tokens.colors.primary,
  },
})
