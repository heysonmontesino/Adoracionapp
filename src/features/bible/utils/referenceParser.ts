import { BIBLE_BOOKS } from '../repository'

interface ParsedReference {
  bookId: string
  chapter: number
  verse?: number
}

// Función para normalizar texto (quitar tildes, caracteres especiales, espacios extra)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-z0-9]/g, ' ') // Dejar solo letras, números y espacios
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim()
}

// Mapa de nombres comunes y abreviaturas a bookId
const BOOK_ALIAS_MAP: Record<string, string> = {
  // Pentateuco
  'genesis': 'gen', 'gen': 'gen', 'gn': 'gen',
  'exodo': 'exo', 'exo': 'exo', 'ex': 'exo',
  'levitico': 'lev', 'lev': 'lev', 'lv': 'lev',
  'numeros': 'num', 'num': 'num', 'nm': 'num',
  'deuteronomio': 'deu', 'deu': 'deu', 'dt': 'deu',
  
  // Históricos
  'josue': 'jos', 'jos': 'jos',
  'jueces': 'jue', 'jue': 'jue', 'jgs': 'jue',
  'rut': 'rut', 'rt': 'rut',
  '1 samuel': '1sa', '1 sam': '1sa', '1sa': '1sa', '1s': '1sa',
  '2 samuel': '2sa', '2 sam': '2sa', '2sa': '2sa', '2s': '2sa',
  '1 reyes': '1ki', '1 rey': '1ki', '1ki': '1ki', '1r': '1ki',
  '2 reyes': '2ki', '2 rey': '2ki', '2ki': '2ki', '2r': '2ki',
  '1 cronicas': '1ch', '1cr': '1ch', '1ch': '1ch',
  '2 cronicas': '2ch', '2cr': '2ch', '2ch': '2ch',
  'esdras': 'ezr', 'ez': 'ezr',
  'nehemias': 'neh', 'neh': 'neh',
  'ester': 'est', 'est': 'est',
  
  // Poéticos
  'job': 'job',
  'salmos': 'psa', 'salmo': 'psa', 'sal': 'psa', 'ps': 'psa',
  'proverbios': 'pro', 'prov': 'pro', 'pr': 'pro',
  'eclesiastes': 'ecc', 'ecc': 'ecc', 'ecl': 'ecc',
  'cantares': 'sng', 'cantares de salomon': 'sng', 'cnt': 'sng',
  
  // Profetas
  'isaias': 'isa', 'isa': 'isa', 'is': 'isa',
  'jeremias': 'jer', 'jer': 'jer', 'jr': 'jer',
  'lamentaciones': 'lam', 'lam': 'lam',
  'ezequiel': 'eze', 'ezq': 'eze',
  'daniel': 'dan', 'dn': 'dan',
  'oseas': 'hos', 'os': 'hos',
  'joel': 'jol', 'jl': 'jol',
  'amos': 'amo', 'am': 'amo',
  'abdias': 'oba', 'abd': 'oba',
  'jonas': 'jon', 'jon': 'jon',
  'miqueas': 'mic', 'miq': 'mic',
  'nahum': 'nam', 'nah': 'nam',
  'habacuc': 'hab', 'hab': 'hab',
  'sofonias': 'zep', 'sof': 'zep',
  'hageo': 'hag', 'hag': 'hag',
  'zacarias': 'zec', 'zac': 'zec',
  'malaquias': 'mal', 'mal': 'mal',
  
  // Nuevo Testamento
  'mateo': 'mat', 'mt': 'mat',
  'marcos': 'mrk', 'mar': 'mrk', 'mc': 'mrk',
  'lucas': 'luk', 'luc': 'luk', 'lc': 'luk',
  'juan': 'jhn', 'jn': 'jhn',
  'hechos': 'act', 'hch': 'act',
  'romanos': 'rom', 'ro': 'rom',
  '1 corintios': '1co', '1 cor': '1co', '1co': '1co', '1c': '1co',
  '2 corintios': '2co', '2 cor': '2co', '2co': '2co', '2c': '2co',
  'galatas': 'gal', 'gal': 'gal', 'gl': 'gal',
  'efesios': 'eph', 'ef': 'eph',
  'filipenses': 'php', 'fil': 'php', 'flp': 'php',
  'colosenses': 'col', 'col': 'col', 'cl': 'col',
  '1 tesalonicenses': '1th', '1 tes': '1th', '1th': '1th', '1t': '1th',
  '2 tesalonicenses': '2th', '2 tes': '2th', '2th': '2th', '2t': '2th',
  '1 timoteo': '1ti', '1 tim': '1ti', '1ti': '1ti',
  '2 timoteo': '2ti', '2 tim': '2ti', '2ti': '2ti',
  'tito': 'tit', 'ti': 'tit',
  'filemon': 'phm', 'phm': 'phm', 'flm': 'phm',
  'hebreos': 'heb', 'heb': 'heb',
  'santiago': 'jas', 'stgo': 'jas', 'st': 'jas',
  '1 pedro': '1pe', '1 pe': '1pe', '1pe': '1pe', '1p': '1pe',
  '2 pedro': '2pe', '2 pe': '2pe', '2pe': '2pe', '2p': '2pe',
  '1 juan': '1jn', '1 jn': '1jn', '1jn': '1jn',
  '2 juan': '2jn', '2 jn': '2jn', '2jn': '2jn',
  '3 juan': '3jn', '3 jn': '3jn', '3jn': '3jn',
  'judas': 'jud', 'jd': 'jud',
  'apocalipsis': 'rev', 'apoc': 'rev', 'rev': 'rev', 'apo': 'rev'
}

export function parseBibleReference(input: string): ParsedReference | null {
  if (!input) return null
  
  // Normalizar entrada inicial
  const text = normalizeText(input)
  
  // Estrategia: Buscar patrón numérico de libro (1, 2, 3) + nombre/abreviatura + números de ref
  // Ejemplo: "1 juan 3 16" -> "1", "juan", "3 16"
  // Ejemplo: "juan3:16" -> "", "juan", "3:16"
  // Ejemplo: "1jn3:16" -> "1", "jn", "3:16"
  
  const mainRegex = /^([123])?\s*([a-z]+)\s*(\d.*)?$/i
  const match = text.match(mainRegex)
  
  if (!match) return null
  
  const prefix = match[1] || ''
  const bookName = match[2]
  const numericPart = match[3] || ''
  
  // Reconstruir nombre de libro para buscar en el mapa
  const bookSearch = prefix ? `${prefix} ${bookName}`.trim() : bookName
  const bookSearchNoSpace = prefix ? `${prefix}${bookName}`.trim() : bookName
  
  let bookId = BOOK_ALIAS_MAP[bookSearch] || BOOK_ALIAS_MAP[bookSearchNoSpace]
  
  if (!bookId) return null
  
  const bookMeta = BIBLE_BOOKS.find(b => b.id === bookId)
  if (!bookMeta) return null
  
  // Parsear capítulo y versículo
  let chapter = 1
  let verse: number | undefined = undefined
  
  if (numericPart) {
    // Dividir por cualquier cosa que no sea número
    const parts = numericPart.split(/[^0-9]+/).filter(p => p.length > 0)
    chapter = parseInt(parts[0]) || 1
    if (parts.length > 1) {
      verse = parseInt(parts[1]) || undefined
    }
  }
  
  // Validar capítulo
  if (chapter < 1) chapter = 1
  if (chapter > bookMeta.chapters) chapter = bookMeta.chapters
  
  return {
    bookId,
    chapter,
    verse
  }
}
