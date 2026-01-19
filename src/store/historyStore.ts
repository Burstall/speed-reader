import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateContentHash } from '@/lib/orp';

export interface ReadingItem {
  id: string;              // Content hash
  title: string;           // Article title or filename
  source: 'text' | 'pdf' | 'url';
  sourceUrl?: string;      // Original URL if from web
  wordCount: number;
  currentIndex: number;
  lastRead: number;        // Timestamp
  preview: string;         // First ~100 chars
  content?: string;        // Full content (for resume) - optional to save space
}

interface HistoryState {
  items: ReadingItem[];

  // Actions
  saveProgress: (
    content: string,
    title: string,
    source: ReadingItem['source'],
    currentIndex: number,
    sourceUrl?: string
  ) => string;
  getProgress: (contentHash: string) => ReadingItem | undefined;
  getByUrl: (url: string) => ReadingItem | undefined;
  removeItem: (id: string) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_ITEMS = 20;
const MAX_STORED_CONTENT_LENGTH = 500000; // ~500KB per item max

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],

      saveProgress: (content, title, source, currentIndex, sourceUrl) => {
        const id = generateContentHash(content);
        const words = content.split(/\s+/).filter(w => w.length > 0);
        const preview = content.slice(0, 100).trim().replace(/\s+/g, ' ') + (content.length > 100 ? '...' : '');

        // Store content only if not too large
        const storedContent = content.length <= MAX_STORED_CONTENT_LENGTH ? content : undefined;

        set((state) => {
          // Remove existing entry for this content
          const filtered = state.items.filter(item => item.id !== id);

          // Add new entry at the beginning
          const newItem: ReadingItem = {
            id,
            title: title || `Untitled (${words.length} words)`,
            source,
            sourceUrl,
            wordCount: words.length,
            currentIndex,
            lastRead: Date.now(),
            preview,
            content: storedContent,
          };

          // Keep only most recent items
          const items = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);

          return { items };
        });

        return id;
      },

      getProgress: (contentHash) => {
        return get().items.find(item => item.id === contentHash);
      },

      getByUrl: (url) => {
        return get().items.find(item => item.sourceUrl === url);
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id),
        }));
      },

      clearHistory: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'speed-reader-history',
    }
  )
);
