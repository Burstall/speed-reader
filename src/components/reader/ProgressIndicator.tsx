'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useReaderStore } from '@/store/readerStore';
import type { ContentHeading } from '@/types';

export function ProgressIndicator() {
  const { currentIndex, words, progress, wpm, jumpTo, chunkSize, contentMeta } = useReaderStore();
  const totalWords = words.length;
  const headings = contentMeta?.headings || [];

  // Dragging state
  const barRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredHeading, setHoveredHeading] = useState<ContentHeading | null>(null);

  // Calculate time remaining
  const wordsRemaining = totalWords - currentIndex - 1;
  const minutesRemaining = wordsRemaining / wpm;
  const timeRemaining = formatTime(minutesRemaining);

  const jumpToPosition = useCallback((clientX: number) => {
    if (totalWords === 0 || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const targetIndex = Math.floor(percentage * totalWords);
    jumpTo(targetIndex);
  }, [totalWords, jumpTo]);

  // Mouse handlers for drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    jumpToPosition(e.clientX);
  }, [jumpToPosition]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      jumpToPosition(e.clientX);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [jumpToPosition]);

  // Touch handlers for drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    jumpToPosition(e.touches[0].clientX);
  }, [jumpToPosition]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      jumpToPosition(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [jumpToPosition]);

  if (totalWords === 0) {
    return null;
  }

  // Word range display for chunks
  const endIndex = Math.min(currentIndex + chunkSize, totalWords);
  const wordLabel = chunkSize > 1
    ? `Words ${currentIndex + 1}-${endIndex} of ${totalWords.toLocaleString()}`
    : `Word ${currentIndex + 1} of ${totalWords.toLocaleString()}`;

  return (
    <div className="w-full space-y-2">
      {/* Progress bar */}
      <div
        ref={barRef}
        className={`
          w-full bg-gray-200 dark:bg-gray-800 rounded-full cursor-pointer overflow-visible relative
          transition-all duration-150 group
          ${isDragging ? 'h-3' : 'h-1.5 hover:h-2.5'}
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${Math.round(progress)}%`}
      >
        {/* Fill */}
        <div
          className="h-full bg-white rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />

        {/* Thumb handle - visible on hover/drag */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-400
            shadow-md transition-opacity duration-150
            ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'}
          `}
          style={{ left: `calc(${progress}% - 7px)` }}
        />

        {/* Heading markers */}
        {headings.map((heading, i) => {
          const pct = (heading.wordIndex / totalWords) * 100;
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 flex items-center"
              style={{ left: `${pct}%` }}
              onMouseEnter={() => setHoveredHeading(heading)}
              onMouseLeave={() => setHoveredHeading(null)}
              onClick={(e) => {
                e.stopPropagation();
                jumpTo(heading.wordIndex);
              }}
            >
              <div
                className={`
                  w-0.5 bg-gray-400 dark:bg-gray-500 cursor-pointer
                  ${heading.level === 1 ? 'h-4 -mt-1' : 'h-3 -mt-0.5'}
                `}
              />
              {/* Tooltip */}
              {hoveredHeading === heading && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                  {heading.title}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{wordLabel}</span>
        <span>{timeRemaining} remaining</span>
      </div>
    </div>
  );
}

function formatTime(minutes: number): string {
  if (minutes < 1) {
    const seconds = Math.ceil(minutes * 60);
    return `${seconds}s`;
  }

  if (minutes < 60) {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    if (secs === 0) {
      return `${mins}m`;
    }
    return `${mins}m ${secs}s`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}
