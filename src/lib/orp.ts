import type { ORPResult } from '@/types';

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
