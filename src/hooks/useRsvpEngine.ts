'use client';

import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/store/readerStore';

/**
 * RSVP timing engine using requestAnimationFrame for precision.
 * Includes smart punctuation pausing for better comprehension.
 * Supports launch mode speed ramping.
 */
export function useRsvpEngine() {
  const { isPlaying, words } = useReaderStore();
  const lastTickRef = useRef<number>(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTickRef.current = 0;
      return;
    }

    const tick = (timestamp: number) => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp;
      }

      // Get current state fresh each tick (important for launch mode ramp)
      const state = useReaderStore.getState();
      const { launch, wpm, currentIndex, advance, chunkSize } = state;

      // Get effective WPM (launch mode or normal)
      const effectiveWpm = launch.isLaunching && launch.rampStartTime > 0
        ? launch.currentWpm
        : wpm;

      const baseMs = (60000 / effectiveWpm) * chunkSize;

      // Get delay for current word/chunk (with punctuation adjustment)
      // For chunks, apply delay based on the last word in the chunk
      const lastWordInChunk = words[Math.min(currentIndex + chunkSize - 1, words.length - 1)] || '';
      const delay = getWordDelay(lastWordInChunk, baseMs, words, currentIndex);

      const elapsed = timestamp - lastTickRef.current;

      if (elapsed >= delay) {
        advance();
        lastTickRef.current = timestamp;
      }

      // Continue animation if still playing
      if (useReaderStore.getState().isPlaying) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTickRef.current = 0;
    };
  }, [isPlaying, words]);
}

/**
 * Calculate display time for a word based on content analysis.
 * Uses Math.max multiplier pattern to apply the most impactful rule.
 */
function getWordDelay(word: string, baseMs: number, words: string[], index: number): number {
  if (!word) return baseMs;

  let multiplier = 1;

  // Quoted sentence endings (must check BEFORE plain sentence endings)
  if (/[.!?]["']$/.test(word)) {
    multiplier = Math.max(multiplier, 1.8);
  }
  // Sentence endings (.!?)
  else if (/[.!?]$/.test(word)) {
    multiplier = Math.max(multiplier, 1.5);
  }

  // Clause breaks (,;:)
  if (/[,;:]$/.test(word)) {
    multiplier = Math.max(multiplier, 1.2);
  }

  // First word after a sentence ending
  if (index > 0) {
    const prevWord = words[index - 1] || '';
    if (/[.!?]["']?$/.test(prevWord)) {
      multiplier = Math.max(multiplier, 1.15);
    }
  }

  // Numbers/dates
  if (/\d/.test(word)) {
    multiplier = Math.max(multiplier, 1.15);
  }

  // ALL CAPS (3+ letters)
  const letters = word.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= 3 && letters === letters.toUpperCase()) {
    multiplier = Math.max(multiplier, 1.15);
  }

  // Hyphenated words
  if (word.includes('-') && word.length > 3) {
    multiplier = Math.max(multiplier, 1.1);
  }

  // Long words (>10 chars)
  if (word.length > 10) {
    multiplier = Math.max(multiplier, 1.1);
  }

  return baseMs * multiplier;
}
