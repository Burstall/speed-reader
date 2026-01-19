'use client';

import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/store/readerStore';

/**
 * RSVP timing engine using requestAnimationFrame for precision.
 * Includes smart punctuation pausing for better comprehension.
 * Supports launch mode speed ramping.
 */
export function useRsvpEngine() {
  const { isPlaying, wpm, advance, words, currentIndex, launch } = useReaderStore();
  const lastTickRef = useRef<number>(0);
  const frameRef = useRef<number | null>(null);

  // Get effective WPM (launch mode or normal)
  const effectiveWpm = launch.isLaunching && launch.rampStartTime > 0
    ? launch.currentWpm
    : wpm;

  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    const tick = (timestamp: number) => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp;
      }

      // Get current effective WPM (may change during launch ramp)
      const currentEffectiveWpm = useReaderStore.getState().launch.isLaunching &&
                                   useReaderStore.getState().launch.rampStartTime > 0
        ? useReaderStore.getState().launch.currentWpm
        : useReaderStore.getState().wpm;

      const baseMs = 60000 / currentEffectiveWpm;

      // Get delay for current word (with punctuation adjustment)
      const currentWord = words[currentIndex] || '';
      const delay = getWordDelay(currentWord, baseMs);

      const elapsed = timestamp - lastTickRef.current;

      if (elapsed >= delay) {
        advance();
        lastTickRef.current = timestamp;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTickRef.current = 0;
    };
  }, [isPlaying, wpm, effectiveWpm, advance, words, currentIndex]);
}

/**
 * Calculate display time for a word based on punctuation.
 * Longer pauses on sentence endings help comprehension.
 */
function getWordDelay(word: string, baseMs: number): number {
  if (!word) return baseMs;

  // Sentence endings - longer pause
  if (/[.!?]$/.test(word)) {
    return baseMs * 1.5;
  }

  // Clause breaks - medium pause
  if (/[,;:]$/.test(word)) {
    return baseMs * 1.2;
  }

  // Paragraph indicators (often end with multiple punctuation or quotes)
  if (/[.!?]["']$/.test(word)) {
    return baseMs * 1.8;
  }

  // Long words take slightly longer to process
  if (word.length > 10) {
    return baseMs * 1.1;
  }

  return baseMs;
}
