'use client';

import { useState, useEffect, useRef } from 'react';
import { useReaderStore } from '@/store/readerStore';
import { useAuthStore } from '@/store/authStore';
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
import { ChunkSizeControl } from '@/components/reader/ChunkSizeControl';
import { useLaunchMode } from '@/hooks/useLaunchMode';
import { ContentTabs } from '@/components/sidebar/ContentTabs';
import { ReadingHistory } from '@/components/sidebar/ReadingHistory';
import { PremiumAccess } from '@/components/sidebar/PremiumAccess';
import { ReadingList } from '@/components/sidebar/ReadingList';
import { Bookmarklet } from '@/components/sidebar/Bookmarklet';
import { DeviceSync } from '@/components/sidebar/DeviceSync';
import { FeedBrowser } from '@/components/sidebar/FeedBrowser';

function ArticleAutoLoader() {
  const { setContent } = useReaderStore();
  const { getCredentialForDomain } = useAuthStore();
  const hasAutoLoaded = useRef(false);
  const [toast, setToast] = useState<{ message: string; type: 'loading' | 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (hasAutoLoaded.current) return;

    // Route B: Check hash fragment for directly-passed content first
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const title = hashParams.get('title');
      const content = hashParams.get('content');

      if (content && content.trim().length > 0) {
        hasAutoLoaded.current = true;

        // Clean URL bar
        window.history.replaceState({}, '', '/');

        setContent(content, {
          title: title || 'Untitled',
          source: 'extension',
        });

        setToast({ message: 'Article loaded', type: 'success' });
        setTimeout(() => setToast(null), 2000);
        return;
      }
    }

    // Route A: Check ?article= query param for server-side fetch
    const params = new URLSearchParams(window.location.search);
    const rawArticleUrl = params.get('article');
    if (!rawArticleUrl) return;
    const articleUrl: string = rawArticleUrl;
    hasAutoLoaded.current = true;

    // Clean URL bar silently (after reading params)
    window.history.replaceState({}, '', '/');

    setToast({ message: 'Loading article...', type: 'loading' });

    async function fetchArticle() {
      try {
        // Try to get stored cookie for this domain
        let cookie: string | null = null;
        try {
          const domain = new URL(articleUrl).hostname;
          cookie = getCredentialForDomain(domain);
        } catch {
          // ignore domain parse errors
        }

        const res = await fetch('/api/fetch/article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: articleUrl, cookie }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to fetch (${res.status})`);
        }

        const data = await res.json();
        const text = data.words.join(' ');
        setContent(text, {
          title: data.title,
          source: 'url',
          sourceUrl: articleUrl,
          headings: data.headings,
        });
        setToast(null);
      } catch (err) {
        setToast({ message: err instanceof Error ? err.message : 'Failed to load article', type: 'error' });
        setTimeout(() => setToast(null), 5000);
      }
    }

    fetchArticle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs ${
        toast.type === 'loading'
          ? 'bg-blue-600 text-white'
          : toast.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
      }`}
    >
      {toast.type === 'loading' && (
        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />
      )}
      {toast.message}
    </div>
  );
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { words, currentIndex, focalColor, reset, isPlaying, launch, contentMeta, chunkSize } = useReaderStore();
  const { saveProgress } = useHistoryStore();
  const readerRef = useRef<HTMLDivElement>(null);

  // Activate RSVP engine, keyboard shortcuts, touch gestures, and launch mode
  useRsvpEngine();
  useKeyboardShortcuts();
  useTouchGestures(readerRef);
  useLaunchMode();

  const currentChunk = words.slice(currentIndex, currentIndex + chunkSize).filter(Boolean);
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
      <ArticleAutoLoader />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-200 lg:relative lg:translate-x-0
          flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header - fixed at top */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h1 className="text-lg font-bold">Speed Reader <span className="text-xs font-normal text-gray-400 dark:text-gray-500">v{process.env.NEXT_PUBLIC_APP_VERSION}</span></h1>
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

          {/* All content scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 -mr-2 pr-2">
            {/* Content input tabs */}
            <ContentTabs />

            {/* Browse premium feeds */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <FeedBrowser />
            </div>

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

            {/* Settings section - now inside scroll area */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
              <SpeedControl />
              <ChunkSizeControl />
              <FocalColorPicker />
              <ThemeToggle />
            </div>

            {/* Clear button */}
            {hasContent && (
              <button
                onClick={reset}
                className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white
                           border border-gray-300 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              >
                Clear Content
              </button>
            )}

            {/* Keyboard shortcuts help */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-600 mb-2">Shortcuts</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-500">
                <span>Space</span><span>Play/Pause</span>
                <span>↑↓</span><span>Speed</span>
                <span>←→</span><span>Skip</span>
                <span>Shift+←→</span><span>Sentence</span>
                <span>R</span><span>Restart</span>
              </div>
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
            className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-6 sm:px-6 md:p-8 shadow-2xl
                       select-none touch-manipulation"
          >
            {/* Word Display */}
            <WordDisplay chunk={currentChunk} focalColor={focalColor} />

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
