import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FocalColor } from '@/types';
import { tokenizeText } from '@/lib/orp';

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
  advance: () => void;
  goBack: (words?: number) => void;
  goForward: (words?: number) => void;
  jumpTo: (index: number) => void;
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
        wpm: Math.min(1200, Math.max(150, wpm)),
      }),

      setFocalColor: (focalColor) => set({ focalColor }),

      setTheme: (theme) => set({ theme }),

      advance: () => {
        const { currentIndex, words } = get();
        if (currentIndex < words.length - 1) {
          const newIndex = currentIndex + 1;
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
        const { currentIndex, words } = get();
        const newIndex = Math.max(0, currentIndex - count);
        set({
          currentIndex: newIndex,
          progress: words.length > 1 ? (newIndex / (words.length - 1)) * 100 : 0,
        });
      },

      goForward: (count = 10) => {
        const { currentIndex, words } = get();
        const newIndex = Math.min(words.length - 1, currentIndex + count);
        set({
          currentIndex: newIndex,
          progress: words.length > 1 ? (newIndex / (words.length - 1)) * 100 : 0,
        });
      },

      jumpTo: (index) => {
        const { words } = get();
        const newIndex = Math.min(words.length - 1, Math.max(0, index));
        set({
          currentIndex: newIndex,
          progress: words.length > 1 ? (newIndex / (words.length - 1)) * 100 : 0,
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
      }),
    }
  )
);
