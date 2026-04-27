import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { VerseAnnotation, BibleReference, FontSizePreference, VerseList, VerseListItem } from './types'

interface BibleState {
  completedChapters: string[]
  annotations: Record<string, VerseAnnotation>
  verseLists: VerseList[]
  recentReferences: BibleReference[]
  fontSize: FontSizePreference
  markAsRead: (bookId: string, chapter: number) => void
  isRead: (bookId: string, chapter: number) => boolean
  saveAnnotation: (annotation: VerseAnnotation) => void
  createVerseList: (name: string) => string
  addVersesToList: (listId: string, items: VerseListItem[]) => void
  addRecentReference: (ref: BibleReference) => void
  setFontSize: (size: FontSizePreference) => void
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
}

export const useBibleStore = create<BibleState>()(
  persist(
    (set, get) => ({
      completedChapters: [],
      annotations: {},
      verseLists: [],
      recentReferences: [],
      fontSize: 'normal',
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      setFontSize: (size) => set({ fontSize: size }),
      
      markAsRead: (bookId, chapter) => {
        const key = `${bookId}-${chapter}`
        const current = get().completedChapters || []
        if (!current.includes(key)) {
          set({ completedChapters: [...current, key] })
        }
      },
      
      isRead: (bookId, chapter) => {
        return (get().completedChapters || []).includes(`${bookId}-${chapter}`)
      },
      
      saveAnnotation: (annotation) => {
        const key = `${annotation.bookId}-${annotation.chapter}-${annotation.verseNumber}`
        const current = get().annotations || {}
        
        const updatedAnnotations = {
          ...current,
          [key]: { 
            ...annotation, 
            updatedAt: new Date().toISOString() 
          }
        }
        
        set({ annotations: updatedAnnotations })
      },

      createVerseList: (name) => {
        const id = `list-${Date.now()}`
        const now = new Date().toISOString()
        const current = get().verseLists || []
        set({
          verseLists: [
            ...current,
            { id, name: name.trim(), items: [], createdAt: now, updatedAt: now },
          ],
        })
        return id
      },

      addVersesToList: (listId, items) => {
        const current = get().verseLists || []
        const now = new Date().toISOString()
        set({
          verseLists: current.map((list) => {
            if (list.id !== listId) return list
            const existingKeys = new Set(list.items.map((item) => `${item.bookId}-${item.chapter}-${item.verseNumber}`))
            const nextItems = [
              ...list.items,
              ...items.filter((item) => !existingKeys.has(`${item.bookId}-${item.chapter}-${item.verseNumber}`)),
            ]
            return { ...list, items: nextItems, updatedAt: now }
          }),
        })
      },

      addRecentReference: (ref) => {
        const current = get().recentReferences || []
        // Filter out if already exists (to move it to top)
        const filtered = current.filter(r => 
          !(r.bookId === ref.bookId && r.chapter === ref.chapter && r.verse === ref.verse)
        )
        
        // Add to top and limit to 8
        const updated = [ref, ...filtered].slice(0, 8)
        set({ recentReferences: updated })
      }
    }),
    {
      name: 'bible-storage-prod', 
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
