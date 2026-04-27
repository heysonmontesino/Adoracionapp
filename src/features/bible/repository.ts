import { BIBLE_ASSET_MAP } from './bibleMap'
import { BibleBook, ChapterContent, Verse } from './types'

export const BIBLE_BOOKS: BibleBook[] = [
  // Antiguo Testamento
  { id: 'gen', name: 'Génesis', chapters: 50, testament: 'Antiguo' },
  { id: 'exo', name: 'Éxodo', chapters: 40, testament: 'Antiguo' },
  { id: 'lev', name: 'Levítico', chapters: 27, testament: 'Antiguo' },
  { id: 'num', name: 'Números', chapters: 36, testament: 'Antiguo' },
  { id: 'deu', name: 'Deuteronomio', chapters: 34, testament: 'Antiguo' },
  { id: 'jos', name: 'Josué', chapters: 24, testament: 'Antiguo' },
  { id: 'jue', name: 'Jueces', chapters: 21, testament: 'Antiguo' },
  { id: 'rut', name: 'Rut', chapters: 4, testament: 'Antiguo' },
  { id: '1sa', name: '1 Samuel', chapters: 31, testament: 'Antiguo' },
  { id: '2sa', name: '2 Samuel', chapters: 24, testament: 'Antiguo' },
  { id: '1ki', name: '1 Reyes', chapters: 22, testament: 'Antiguo' },
  { id: '2ki', name: '2 Reyes', chapters: 25, testament: 'Antiguo' },
  { id: '1ch', name: '1 Crónicas', chapters: 29, testament: 'Antiguo' },
  { id: '2ch', name: '2 Crónicas', chapters: 36, testament: 'Antiguo' },
  { id: 'ezr', name: 'Esdras', chapters: 10, testament: 'Antiguo' },
  { id: 'neh', name: 'Nehemías', chapters: 13, testament: 'Antiguo' },
  { id: 'est', name: 'Ester', chapters: 10, testament: 'Antiguo' },
  { id: 'job', name: 'Job', chapters: 42, testament: 'Antiguo' },
  { id: 'psa', name: 'Salmos', chapters: 150, testament: 'Antiguo' },
  { id: 'pro', name: 'Proverbios', chapters: 31, testament: 'Antiguo' },
  { id: 'ecc', name: 'Eclesiastés', chapters: 12, testament: 'Antiguo' },
  { id: 'sng', name: 'Cantares', chapters: 8, testament: 'Antiguo' },
  { id: 'isa', name: 'Isaías', chapters: 66, testament: 'Antiguo' },
  { id: 'jer', name: 'Jeremías', chapters: 52, testament: 'Antiguo' },
  { id: 'lam', name: 'Lamentaciones', chapters: 5, testament: 'Antiguo' },
  { id: 'eze', name: 'Ezequiel', chapters: 48, testament: 'Antiguo' },
  { id: 'dan', name: 'Daniel', chapters: 12, testament: 'Antiguo' },
  { id: 'hos', name: 'Oseas', chapters: 14, testament: 'Antiguo' },
  { id: 'jol', name: 'Joel', chapters: 3, testament: 'Antiguo' },
  { id: 'amo', name: 'Amós', chapters: 9, testament: 'Antiguo' },
  { id: 'oba', name: 'Abdías', chapters: 1, testament: 'Antiguo' },
  { id: 'jon', name: 'Jonás', chapters: 4, testament: 'Antiguo' },
  { id: 'mic', name: 'Miqueas', chapters: 7, testament: 'Antiguo' },
  { id: 'nam', name: 'Nahum', chapters: 3, testament: 'Antiguo' },
  { id: 'hab', name: 'Habacuc', chapters: 3, testament: 'Antiguo' },
  { id: 'zep', name: 'Sofonías', chapters: 3, testament: 'Antiguo' },
  { id: 'hag', name: 'Hageo', chapters: 2, testament: 'Antiguo' },
  { id: 'zec', name: 'Zacarías', chapters: 14, testament: 'Antiguo' },
  { id: 'mal', name: 'Malaquías', chapters: 4, testament: 'Antiguo' },
  // Nuevo Testamento
  { id: 'mat', name: 'Mateo', chapters: 28, testament: 'Nuevo' },
  { id: 'mrk', name: 'Marcos', chapters: 16, testament: 'Nuevo' },
  { id: 'luk', name: 'Lucas', chapters: 24, testament: 'Nuevo' },
  { id: 'jhn', name: 'Juan', chapters: 21, testament: 'Nuevo' },
  { id: 'act', name: 'Hechos', chapters: 28, testament: 'Nuevo' },
  { id: 'rom', name: 'Romanos', chapters: 16, testament: 'Nuevo' },
  { id: '1co', name: '1 Corintios', chapters: 16, testament: 'Nuevo' },
  { id: '2co', name: '2 Corintios', chapters: 13, testament: 'Nuevo' },
  { id: 'gal', name: 'Gálatas', chapters: 6, testament: 'Nuevo' },
  { id: 'eph', name: 'Efesios', chapters: 6, testament: 'Nuevo' },
  { id: 'php', name: 'Filipenses', chapters: 4, testament: 'Nuevo' },
  { id: 'col', name: 'Colosenses', chapters: 4, testament: 'Nuevo' },
  { id: '1th', name: '1 Tesalonicenses', chapters: 5, testament: 'Nuevo' },
  { id: '2th', name: '2 Tesalonicenses', chapters: 3, testament: 'Nuevo' },
  { id: '1ti', name: '1 Timoteo', chapters: 6, testament: 'Nuevo' },
  { id: '2ti', name: '2 Timoteo', chapters: 4, testament: 'Nuevo' },
  { id: 'tit', name: 'Tito', chapters: 3, testament: 'Nuevo' },
  { id: 'phm', name: 'Filemón', chapters: 1, testament: 'Nuevo' },
  { id: 'heb', name: 'Hebreos', chapters: 13, testament: 'Nuevo' },
  { id: 'jas', name: 'Santiago', chapters: 5, testament: 'Nuevo' },
  { id: '1pe', name: '1 Pedro', chapters: 5, testament: 'Nuevo' },
  { id: '2pe', name: '2 Pedro', chapters: 3, testament: 'Nuevo' },
  { id: '1jn', name: '1 Juan', chapters: 5, testament: 'Nuevo' },
  { id: '2jn', name: '2 Juan', chapters: 1, testament: 'Nuevo' },
  { id: '3jn', name: '3 Juan', chapters: 1, testament: 'Nuevo' },
  { id: 'jud', name: 'Judas', chapters: 1, testament: 'Nuevo' },
  { id: 'rev', name: 'Apocalipsis', chapters: 22, testament: 'Nuevo' },
]

export const getBookById = (id: string) => BIBLE_BOOKS.find(b => b.id === id)

export const fetchChapterContent = async (bookId: string, chapter: number): Promise<ChapterContent> => {
  const book = getBookById(bookId)
  if (!book) throw new Error("Libro no encontrado")

  const asset = BIBLE_ASSET_MAP[bookId]
  if (!asset) throw new Error(`Contenido para ${book.name} no disponible`)

  const chapterData: string[] = asset[chapter - 1]
  if (!chapterData) throw new Error(`Capítulo ${chapter} no encontrado`)

  const verses: Verse[] = chapterData.map((text, index) => ({
    number: index + 1,
    text: text
  }))
  
  return {
    bookId,
    chapter,
    verses
  }
}

export const getDailyReading = () => {
  const dayOfYear = Math.floor(Date.now() / 86400000)
  const choices = [
    { bookId: 'psa', chapter: 23 },
    { bookId: 'jhn', chapter: 1 },
    { bookId: 'rom', chapter: 8 },
    { bookId: 'psa', chapter: 1 },
  ]
  return choices[dayOfYear % choices.length]
}

export const getVerseText = async (bookId: string, chapter: number, verseNumber: number): Promise<string> => {
  const content = await fetchChapterContent(bookId, chapter)
  const verse = content.verses.find(v => v.number === verseNumber)
  return verse?.text || "Texto no disponible"
}
