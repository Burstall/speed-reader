'use client';

import { useEffect } from 'react';
import { useReaderStore } from '@/store/readerStore';

/**
 * Keyboard shortcuts for the reader:
 * - Space: Play/Pause
 * - Arrow Up: Increase speed (+25 WPM)
 * - Arrow Down: Decrease speed (-25 WPM)
 * - Arrow Left: Go back 10 words
 * - Arrow Right: Skip forward 10 words
 * - R: Restart
 * - Escape: Pause
 */
export function useKeyboardShortcuts() {
  const { toggle, setWpm, wpm, goBack, goForward, restart, pause, words } = useReaderStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Don't handle shortcuts if no content loaded
      const hasContent = words.length > 0;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (hasContent) toggle();
          break;

        case 'ArrowUp':
          e.preventDefault();
          setWpm(wpm + 25);
          break;

        case 'ArrowDown':
          e.preventDefault();
          setWpm(wpm - 25);
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (hasContent) goBack(10);
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (hasContent) goForward(10);
          break;

        case 'KeyR':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            if (hasContent) restart();
          }
          break;

        case 'Escape':
          pause();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, setWpm, wpm, goBack, goForward, restart, pause, words]);
}
