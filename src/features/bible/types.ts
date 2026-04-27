export type BibleBook = {
  id: string;
  name: string;
  chapters: number;
  testament: 'Antiguo' | 'Nuevo';
}

export type Verse = {
  number: number;
  text: string;
}

export type ChapterContent = {
  bookId: string;
  chapter: number;
  verses: Verse[];
}

export type DailyReading = {
  date: string; // ISO string
  bookId: string;
  chapter: number;
  isCompleted: boolean;
}

export type VerseAnnotation = {
  bookId: string;
  chapter: number;
  verseNumber: number;
  favorite: boolean;
  highlightColor: string | null;
  note: string | null;
  updatedAt: string;
}

export type BibleReference = {
  bookId: string;
  chapter: number;
  verse?: number;
  bookName: string;
  timestamp: string;
}

export type VerseListItem = {
  bookId: string;
  chapter: number;
  verseNumber: number;
  text: string;
  bookName: string;
  addedAt: string;
}

export type VerseList = {
  id: string;
  name: string;
  items: VerseListItem[];
  createdAt: string;
  updatedAt: string;
}

export type FontSizePreference = 'small' | 'normal' | 'large' | 'extraLarge';
