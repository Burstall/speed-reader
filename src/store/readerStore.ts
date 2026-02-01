import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FocalColor, ContentHeading } from '@/types';
import { tokenizeText, findPreviousSentenceStart, findNextSentenceStart } from '@/lib/orp';

interface LaunchState {
  isLaunching: boolean;
  countdown: number;      // 3, 2, 1, 0
  currentWpm: number;     // Current speed during ramp
  targetWpm: number;      // Target speed to reach
  rampStartTime: number;  // When ramp started
}

interface ContentMeta {
  title: string;
  source: 'text' | 'pdf' | 'url';
  sourceUrl?: string;
  headings?: ContentHeading[];
}

interface ReaderState {
  // Content
  words: string[];
  currentIndex: number;
  contentMeta: ContentMeta | null;

  // Playback
  isPlaying: boolean;
  wpm: number;

  // Launch mode
  launch: LaunchState;

  // Settings
  focalColor: FocalColor;
  theme: 'dark' | 'light' | 'system';
  chunkSize: 1 | 2 | 3;

  // Computed
  progress: number;

  // Actions
  setContent: (text: string, meta?: Partial<ContentMeta>) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  setWpm: (wpm: number) => void;
  setFocalColor: (color: FocalColor) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setChunkSize: (size: 1 | 2 | 3) => void;
  advance: () => void;
  goBack: (words?: number) => void;
  goForward: (words?: number) => void;
  jumpTo: (index: number) => void;
  goBackSentence: () => void;
  goForwardSentence: () => void;
  reset: () => void;

  // Launch mode actions
  startLaunch: () => void;
  updateCountdown: (count: number) => void;
  startRamp: () => void;
  updateRampWpm: (wpm: number) => void;
  endLaunch: () => void;
  cancelLaunch: () => void;
}

const INITIAL_LAUNCH: LaunchState = {
  isLaunching: false,
  countdown: 0,
  currentWpm: 150,
  targetWpm: 300,
  rampStartTime: 0,
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      // Initial state
      words: [],
      currentIndex: 0,
      contentMeta: null,
      isPlaying: false,
      wpm: 300,
      focalColor: 'red',
      theme: 'dark',
      chunkSize: 1,
      progress: 0,
      launch: INITIAL_LAUNCH,

      // Actions
      setContent: (text, meta) => {
        const words = tokenizeText(text);
        const wordCount = words.length;
        set({
          words,
          currentIndex: 0,
          progress: 0,
          isPlaying: false,
          launch: INITIAL_LAUNCH,
          contentMeta: meta ? {
            title: meta.title || `Untitled (${wordCount} words)`,
            source: meta.source || 'text',
            sourceUrl: meta.sourceUrl,
            headings: meta.headings,
          } : {
            title: `Pasted text (${wordCount} words)`,
            source: 'text',
          },
        });
      },

      play: () => set({ isPlaying: true }),

      pause: () => set({
        isPlaying: false,
        launch: INITIAL_LAUNCH, // Cancel any launch in progress
      }),

      toggle: () => {
        const { isPlaying, words, launch } = get();
        if (words.length === 0) return;
        if (launch.isLaunching) {
          // Cancel launch if toggling during launch
          set({ launch: INITIAL_LAUNCH });
          return;
        }
        set({ isPlaying: !isPlaying });
      },

      restart: () => set({
        currentIndex: 0,
        progress: 0,
        isPlaying: false,
        launch: INITIAL_LAUNCH,
      }),

      setWpm: (wpm) => set({
        wpm: Math.min(900, Math.max(150, wpm)),
      }),

      setFocalColor: (focalColor) => set({ focalColor }),

      setTheme: (theme) => set({ theme }),

      setChunkSize: (chunkSize) => {
        const { currentIndex } = get();
        // Snap current position to chunk boundary
        const snapped = Math.floor(currentIndex / chunkSize) * chunkSize;
        set({ chunkSize, currentIndex: snapped });
      },

      advance: () => {
        const { currentIndex, words, chunkSize } = get();
        if (currentIndex < words.length - 1) {
          const newIndex = Math.min(currentIndex + chunkSize, words.length - 1);
          set({
            currentIndex: newIndex,
            progress: (newIndex / (words.length - 1)) * 100,
          });
        } else {
          // Reached the end
          set({ isPlaying: false, launch: INITIAL_LAUNCH });
        }
      },

      goBack: (count = 10) => {
        const { currentIndex, words, chunkSize } = get();
        const newIndex = Math.max(0, currentIndex - count);
        // Snap to chunk boundary
        const snapped = Math.floor(newIndex / chunkSize) * chunkSize;
        set({
          currentIndex: snapped,
          progress: words.length > 1 ? (snapped / (words.length - 1)) * 100 : 0,
        });
      },

      goForward: (count = 10) => {
        const { currentIndex, words, chunkSize } = get();
        const newIndex = Math.min(words.length - 1, currentIndex + count);
        // Snap to chunk boundary
        const snapped = Math.floor(newIndex / chunkSize) * chunkSize;
        set({
          currentIndex: snapped,
          progress: words.length > 1 ? (snapped / (words.length - 1)) * 100 : 0,
        });
      },

      jumpTo: (index) => {
        const { words, chunkSize } = get();
        const clamped = Math.min(words.length - 1, Math.max(0, index));
        // Snap to chunk boundary
        const snapped = Math.floor(clamped / chunkSize) * chunkSize;
        set({
          currentIndex: snapped,
          progress: words.length > 1 ? (snapped / (words.length - 1)) * 100 : 0,
        });
      },

      goBackSentence: () => {
        const { currentIndex, words, chunkSize } = get();
        const target = findPreviousSentenceStart(words, currentIndex);
        // Snap to chunk boundary
        const snapped = Math.floor(target / chunkSize) * chunkSize;
        set({
          currentIndex: snapped,
          progress: words.length > 1 ? (snapped / (words.length - 1)) * 100 : 0,
        });
      },

      goForwardSentence: () => {
        const { currentIndex, words, chunkSize } = get();
        const target = findNextSentenceStart(words, currentIndex);
        // Snap to chunk boundary
        const snapped = Math.floor(target / chunkSize) * chunkSize;
        set({
          currentIndex: snapped,
          progress: words.length > 1 ? (snapped / (words.length - 1)) * 100 : 0,
        });
      },

      reset: () => set({
        words: [],
        currentIndex: 0,
        contentMeta: null,
        isPlaying: false,
        progress: 0,
        launch: INITIAL_LAUNCH,
      }),

      // Launch mode actions
      startLaunch: () => {
        const { wpm, words } = get();
        if (words.length === 0) return;
        set({
          launch: {
            isLaunching: true,
            countdown: 3,
            currentWpm: 150,
            targetWpm: wpm,
            rampStartTime: 0,
          },
        });
      },

      updateCountdown: (count) => {
        set((state) => ({
          launch: { ...state.launch, countdown: count },
        }));
      },

      startRamp: () => {
        set((state) => ({
          isPlaying: true,
          launch: {
            ...state.launch,
            countdown: 0,
            rampStartTime: Date.now(),
          },
        }));
      },

      updateRampWpm: (currentWpm) => {
        set((state) => ({
          launch: { ...state.launch, currentWpm },
        }));
      },

      endLaunch: () => {
        set({ launch: INITIAL_LAUNCH });
      },

      cancelLaunch: () => {
        set({
          isPlaying: false,
          launch: INITIAL_LAUNCH,
        });
      },
    }),
    {
      name: 'speed-reader-settings',
      partialize: (state) => ({
        wpm: state.wpm,
        focalColor: state.focalColor,
        theme: state.theme,
        chunkSize: state.chunkSize,
      }),
    }
  )
);
