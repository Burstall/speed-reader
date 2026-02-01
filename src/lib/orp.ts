import type { ORPResult, ContentHeading } from '@/types';

/**
 * Calculate the Optimal Recognition Point (ORP) for a word.
 * The ORP is the letter position where the eye naturally focuses
 * for optimal word recognition during speed reading.
 *
 * Based on research, the ORP is typically at 25-35% into the word,
 * with specific adjustments for shorter words.
 */
export function calculateORP(word: string): ORPResult {
  const len = word.length;
  const orpIndex = getORPIndex(len);

  return {
    before: word.slice(0, orpIndex),
    focal: word[orpIndex] || '',
    after: word.slice(orpIndex + 1),
    focalIndex: orpIndex,
  };
}

/**
 * Get the ORP index based on word length.
 * Empirically derived positions for optimal recognition.
 */
function getORPIndex(length: number): number {
  if (length <= 1) return 0;
  if (length <= 2) return 0;      // "to" → "T"o
  if (length <= 4) return 1;      // "word" → w"O"rd
  if (length <= 6) return 1;      // "letter" → l"E"tter
  if (length <= 8) return 2;      // "reading" → re"A"ding
  if (length <= 10) return 3;     // "understand" → und"E"rstand

  // For very long words, use ~35% position
  return Math.floor(length * 0.35);
}

/**
 * Tokenize text into words for RSVP display.
 * Preserves punctuation attached to words.
 * Handles various whitespace characters and edge cases.
 */
export function tokenizeText(text: string): string[] {
  return text
    // Normalize all whitespace types (including non-breaking spaces, tabs, newlines)
    .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]+/g, ' ')
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Fix missing spaces after sentence-ending punctuation followed by quotes then capital
    // e.g., 'Martian."Yet' → 'Martian." Yet'
    .replace(/([.!?])(['""\)\]]+)([A-Z])/g, '$1$2 $3')
    // Fix missing spaces after sentence-ending punctuation followed directly by capital
    // e.g., 'end.Start' → 'end. Start'
    .replace(/([.!?])([A-Z])/g, '$1 $2')
    // Fix missing spaces after closing quotes followed by capital
    // e.g., 'said"He' → 'said" He'
    .replace(/(['""])([A-Z])/g, '$1 $2')
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    // Ensure no word is excessively long (split on em-dash, etc.)
    .flatMap(word => {
      // If word is very long and contains natural break points, split it
      if (word.length > 25) {
        // Split on em-dash or double-hyphen but keep the punctuation
        const parts = word.split(/(?<=—)|(?=—)|(?<=--)|(?=--)/);
        if (parts.length > 1) {
          return parts.filter(p => p.length > 0);
        }
      }
      return [word];
    });
}

/**
 * Check if a word ends a sentence.
 */
export function isSentenceEnding(word: string): boolean {
  return /[.!?]["']?$/.test(word);
}

/**
 * Find the start of the previous sentence from the given index.
 * Walks backward to find the previous sentence-ending word,
 * then returns the word after it (the start of that sentence).
 */
export function findPreviousSentenceStart(words: string[], fromIndex: number): number {
  // First, walk back past any current sentence to find the ending of the prior sentence
  let i = fromIndex - 1;

  // Skip back to find the sentence ending before the current sentence
  // First skip any non-ending words (we're in the middle of a sentence)
  while (i >= 0 && !isSentenceEnding(words[i])) {
    i--;
  }

  // Now we're at the end of the previous sentence. Skip back again to find its start.
  if (i > 0) {
    i--;
    while (i >= 0 && !isSentenceEnding(words[i])) {
      i--;
    }
    // The sentence starts at the word after the sentence ending
    return i + 1;
  }

  // We've reached the beginning
  return 0;
}

/**
 * Find the start of the next sentence from the given index.
 * Walks forward to find the next sentence-ending word,
 * then returns the word after it.
 */
export function findNextSentenceStart(words: string[], fromIndex: number): number {
  let i = fromIndex;

  // Find the next sentence ending
  while (i < words.length && !isSentenceEnding(words[i])) {
    i++;
  }

  // Move past the ending to the start of the next sentence
  if (i < words.length - 1) {
    return i + 1;
  }

  // Already at or past the last sentence
  return words.length - 1;
}

/**
 * Calculate ORP for a multi-word chunk.
 * For 2 words: focal on word 0. For 3 words: focal on word 1 (middle).
 * Joins words with space and computes focal position in full string.
 */
export function calculateChunkORP(chunk: string[]): ORPResult {
  if (chunk.length <= 1) {
    return calculateORP(chunk[0] || '');
  }

  // Determine which word gets the focal
  const focalWordIdx = chunk.length === 2 ? 0 : 1;
  const focalWord = chunk[focalWordIdx];
  const focalResult = calculateORP(focalWord);

  // Build the full string and find the focal position within it
  const fullStr = chunk.join(' ');

  // Calculate offset of the focal word in the full string
  let offset = 0;
  for (let i = 0; i < focalWordIdx; i++) {
    offset += chunk[i].length + 1; // +1 for space
  }

  const focalIndex = offset + focalResult.focalIndex;

  return {
    before: fullStr.slice(0, focalIndex),
    focal: fullStr[focalIndex] || '',
    after: fullStr.slice(focalIndex + 1),
    focalIndex,
  };
}

/**
 * Detect headings from plain text using heuristics.
 * Works for well-formatted text/PDFs with title-case or ALL CAPS headings.
 */
export function detectHeadingsFromText(text: string, words: string[]): ContentHeading[] {
  const headings: ContentHeading[] = [];
  const lines = text.split('\n');
  let wordCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const prevLine = i > 0 ? lines[i - 1].trim() : '';

    if (line.length === 0) {
      continue;
    }

    // Count words in this line to track position
    const lineWords = line.split(/\s+/).filter(w => w.length > 0);

    // Heuristic: short line (< 80 chars), preceded by blank line, all-caps or title-case
    if (line.length < 80 && line.length > 2 && prevLine === '') {
      const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
      const isTitleCase = /^[A-Z][a-zA-Z]*(\s+[A-Z][a-zA-Z]*)*[.:!?]?$/.test(line);
      // Also match numbered headings like "1. Introduction" or "Chapter 3:"
      const isNumberedHeading = /^\d+[.)]\s+[A-Z]/.test(line) || /^(Chapter|Part|Section)\s+\d/i.test(line);

      if (isAllCaps || isTitleCase || isNumberedHeading) {
        headings.push({
          wordIndex: wordCount,
          title: line,
          level: isAllCaps ? 1 : 2,
        });
      }
    }

    wordCount += lineWords.length;
  }

  return headings;
}

/**
 * Generate a hash for content identification.
 * Used for tracking reading progress per document.
 */
export function generateContentHash(content: string): string {
  // Simple hash using first 10K chars
  const sample = content.slice(0, 10000);
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
