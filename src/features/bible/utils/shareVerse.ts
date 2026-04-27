import { Share } from 'react-native';

// We do NOT import expo-clipboard at the top level because it causes a runtime 
// crash if the native module is not linked in the current binary.
// Instead, we check for its availability safely.

/**
 * Formats a verse with its reference and version
 */
export const formatVerseForSharing = (
  text: string,
  bookName: string,
  chapter: number,
  verseNumber: number
) => {
  return `"${text.trim()}"\n— ${bookName} ${chapter}:${verseNumber} (RVR1960)`;
};

/**
 * Copies a formatted verse to the system clipboard
 */
export const copyVerseToClipboard = async (
  text: string,
  bookName: string,
  chapter: number,
  verseNumber: number
) => {
  try {
    const formattedText = formatVerseForSharing(text, bookName, chapter, verseNumber);
    
    // Defensive check: Try to require the module only when needed
    // In some environments, top-level imports of missing native modules crash the app
    let Clipboard;
    try {
      Clipboard = require('expo-clipboard');
    } catch (e) {
      console.warn('Clipboard module could not be loaded:', e);
    }

    if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
      await Clipboard.setStringAsync(formattedText);
      return true;
    } else {
      console.warn('Clipboard module is not available in this build.');
      return false;
    }
  } catch (error) {
    console.error('Error copying verse:', error);
    return false;
  }
};

/**
 * Opens the native share sheet with a formatted verse
 */
export const shareVerse = async (
  text: string,
  bookName: string,
  chapter: number,
  verseNumber: number
) => {
  try {
    const formattedText = formatVerseForSharing(text, bookName, chapter, verseNumber);
    const result = await Share.share({
      message: formattedText,
    });
    return result;
  } catch (error) {
    console.error('Error sharing verse:', error);
    return null;
  }
};

