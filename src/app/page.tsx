'use client';

import { useState, useEffect, useRef } from 'react';
import { useReaderStore } from '@/store/readerStore';
import { useHistoryStore } from '@/store/historyStore';
import { useRsvpEngine } from '@/hooks/useRsvpEngine';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { WordDisplay } from '@/components/reader/WordDisplay';
import { PlaybackControls } from '@/components/reader/PlaybackControls';
import { SpeedControl } from '@/components/reader/SpeedControl';
import { ProgressIndicator } from '@/components/reader/ProgressIndicator';
import { FocalColorPicker } from '@/components/reader/FocalColorPicker';
import { LaunchButton } from '@/components/reader/LaunchButton';
import { ThemeToggle } from '@/components/reader/ThemeToggle';
import { useLaunchMode } from '@/hooks/useLaunchMode';
import { ContentTabs } from '@/components/sidebar/ContentTabs';
import { ReadingHistory } from '@/components/sidebar/ReadingHistory';
import { PremiumAccess } from '@/components/sidebar/PremiumAccess';
import { ReadingList } from '@/components/sidebar/ReadingList';
import { Bookmarklet } from '@/components/sidebar/Bookmarklet';
import { DeviceSync } from '@/components/sidebar/DeviceSync';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { words, currentIndex, focalColor, reset, isPlaying, launch, contentMeta } = useReaderStore();
  const { saveProgress } = useHistoryStore();
  const readerRef = useRef<HTMLDivElement>(null);

  // Activate RSVP engine, keyboard shortcuts, touch gestures, and launch mode
  useRsvpEngine();
  useKeyboardShortcuts();
  useTouchGestures(readerRef);
  useLaunchMode();

  const currentWord = words[currentIndex] || '';
  const hasContent = words.length > 0;
  const showCountdown = launch.isLaunching && launch.countdown > 0;

  // Auto-save progress periodically
  useEffect(() => {
    if (!hasContent) return;

    const interval = setInterval(() => {
      const content = words.join(' ');
      saveProgress(
        content,
        contentMeta?.title || 'Reading Session',
        contentMeta?.source || 'text',
        currentIndex,
        contentMeta?.sourceUrl
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [hasContent, words, currentIndex, saveProgress, contentMeta]);

  // Save progress on pause
  useEffect(() => {
    if (hasContent && !isPlaying && currentIndex > 0) {
      const content = words.join(' ');
      saveProgress(
        content,
        contentMeta?.title || 'Reading Session',
        contentMeta?.source || 'text',
        currentIndex,
        contentMeta?.sourceUrl
      );
    }
  }, [isPlaying, hasContent, words, currentIndex, saveProgress, contentMeta]);

  // Close sidebar on mobile when content loads
  useEffect(() => {
    if (hasContent && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [hasContent]);

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-200 lg:relative lg:translate-x-0
          flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full p-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h1 className="text-lg font-bold">Speed Reader</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content input tabs */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <ContentTabs />

            {/* Saved reading list (offline) */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <ReadingList />
            </div>

            {/* Reading history */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <ReadingHistory />
            </div>

            {/* Premium service access */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <PremiumAccess />
            </div>

            {/* Device sync (QR code for mobile) */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <DeviceSync />
            </div>

            {/* Bookmarklet for saving articles */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <Bookmarklet />
            </div>
          </div>

          {/* Settings section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 space-y-4">
            <SpeedControl />
            <FocalColorPicker />
            <ThemeToggle />
          </div>

          {/* Clear button */}
          {hasContent && (
            <button
              onClick={reset}
              className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white
                         border border-gray-300 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors flex-shrink-0"
            >
              Clear Content
            </button>
          )}

          {/* Keyboard shortcuts help */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-600 mb-2">Shortcuts</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-500">
              <span>Space</span><span>Play/Pause</span>
              <span>↑↓</span><span>Speed</span>
              <span>←→</span><span>Skip</span>
              <span>R</span><span>Restart</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar toggle for mobile */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden p-3 bg-white dark:bg-gray-900 rounded-full
                     text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-800 shadow-lg"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main reader area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 min-h-screen relative">
        {/* Countdown overlay - positioned over reader pane only */}
        {showCountdown && (
          <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center">
            <div className="text-center">
              <div className="text-9xl font-bold text-white animate-pulse">
                {launch.countdown}
              </div>
              <p className="mt-4 text-gray-400">Get ready...</p>
              <button
                onClick={() => useReaderStore.getState().cancelLaunch()}
                className="mt-8 text-gray-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="w-full max-w-3xl">
          {/* Reader Card - touch enabled */}
          <div
            ref={readerRef}
            className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8 shadow-2xl
                       select-none touch-manipulation"
          >
            {/* Word Display */}
            <WordDisplay word={currentWord} focalColor={focalColor} />

            {/* Progress */}
            <div className="mt-6">
              <ProgressIndicator />
            </div>

            {/* Playback Controls */}
            <div className="mt-6">
              <PlaybackControls />
            </div>

            {/* Launch Button - shown when not playing */}
            {hasContent && !isPlaying && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <LaunchButton />
              </div>
            )}

            {/* Speed indicator during launch ramp */}
            {launch.isLaunching && launch.rampStartTime > 0 && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Ramping: <span className="font-mono text-gray-900 dark:text-white">{launch.currentWpm}</span> → {launch.targetWpm} WPM
                </span>
              </div>
            )}
          </div>

          {/* Hint when no content */}
          {!hasContent && (
            <div className="text-center mt-6 space-y-2">
              <p className="text-gray-500 dark:text-gray-600 text-sm">
                Paste text, upload PDF, or enter URL to start
              </p>
              <p className="text-gray-400 dark:text-gray-700 text-xs lg:hidden">
                Tap to play/pause • Swipe to skip
              </p>
              <p className="text-gray-400 dark:text-gray-700 text-xs hidden lg:block">
                Space to play • Arrows to control speed & skip
              </p>
            </div>
          )}

          {/* Mobile touch hints */}
          {hasContent && !isPlaying && (
            <p className="text-center text-gray-400 dark:text-gray-700 text-xs mt-4 lg:hidden">
              Tap to play/pause • Swipe left/right to skip
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
