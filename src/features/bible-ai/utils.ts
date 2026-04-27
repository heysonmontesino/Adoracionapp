/**
 * Bible AI Utilities
 * Helper functions for Bible AI insights
 */

const OLD_TESTAMENT_BOOKS = [
  'gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jue', 'rut',
  '1sa', '2sa', '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh', 'est',
  'job', 'psa', 'pro', 'ecc', 'sng',
  'isa', 'jer', 'lam', 'eze', 'dan',
  'hos', 'jol', 'amo', 'oba', 'jon', 'mic', 'nam', 'hab', 'zep', 'hag', 'zec', 'mal',
]

const NEW_TESTAMENT_BOOKS = [
  'mat', 'mrk', 'luk', 'jhn', 'act',
  'rom', '1co', '2co', 'gal', 'eph', 'php', 'col',
  '1th', '2th', '1ti', '2ti', 'tit', 'phm',
  'heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 'rev',
]

export function isOldTestament(bookName: string): boolean {
  // Try matching by book name or by checking if it's in known NT list
  const bookLower = bookName.toLowerCase()
  
  // Check if it's explicitly in NT list
  const isInNT = NEW_TESTAMENT_BOOKS.some(id => bookLower.includes(id))
  if (isInNT) return false
  
  // Check if it's explicitly in OT list
  const isInOT = OLD_TESTAMENT_BOOKS.some(id => bookLower.includes(id))
  if (isInOT) return true
  
  // Default to true for unlisted books (most are OT)
  return true
}

export function getOriginalLanguage(bookName: string): string {
  return isOldTestament(bookName) 
    ? 'Hebreo bíblico (con secciones en arameo)' 
    : 'Griego koiné'
}
