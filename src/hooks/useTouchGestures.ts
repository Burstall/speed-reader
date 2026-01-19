'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useReaderStore } from '@/store/readerStore';

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

const SWIPE_THRESHOLD = 50;  // Minimum distance for swipe
const SWIPE_TIMEOUT = 300;   // Max time for swipe gesture
const TAP_THRESHOLD = 10;    // Max movement for tap

export function useTouchGestures(elementRef: React.RefObject<HTMLElement>) {
  const { toggle, goBack, goForward, words } = useReaderStore();
  const touchState = useRef<TouchState | null>(null);
  const hasContent = words.length > 0;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchState.current || !hasContent) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const deltaTime = Date.now() - touchState.current.startTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check for tap (minimal movement)
    if (absX < TAP_THRESHOLD && absY < TAP_THRESHOLD && deltaTime < SWIPE_TIMEOUT) {
      toggle();
      touchState.current = null;
      return;
    }

    // Check for horizontal swipe
    if (absX > SWIPE_THRESHOLD && absX > absY && deltaTime < SWIPE_TIMEOUT) {
      if (deltaX > 0) {
        // Swipe right - go back
        goBack(10);
      } else {
        // Swipe left - skip forward
        goForward(10);
      }
    }

    touchState.current = null;
  }, [toggle, goBack, goForward, hasContent]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchEnd]);
}
