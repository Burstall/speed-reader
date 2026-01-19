'use client';

import { useReaderStore } from '@/store/readerStore';

export function PlaybackControls() {
  const { isPlaying, toggle, restart, goBack, goForward, words } = useReaderStore();
  const hasContent = words.length > 0;

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {/* Restart */}
      <button
        onClick={restart}
        disabled={!hasContent}
        className="p-2 md:p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Restart (R)"
        aria-label="Restart"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Rewind 10 words */}
      <button
        onClick={() => goBack(10)}
        disabled={!hasContent}
        className="p-2 md:p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Back 10 words (←)"
        aria-label="Go back 10 words"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={toggle}
        disabled={!hasContent}
        className="p-4 md:p-5 rounded-full bg-white text-black hover:bg-gray-200
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Skip forward 10 words */}
      <button
        onClick={() => goForward(10)}
        disabled={!hasContent}
        className="p-2 md:p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Forward 10 words (→)"
        aria-label="Skip forward 10 words"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
        </svg>
      </button>

      {/* Speed indicator (compact) */}
      <div className="hidden md:block ml-4 text-gray-500 text-sm">
        ↑↓ speed
      </div>
    </div>
  );
}
