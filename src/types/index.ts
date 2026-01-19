// Reader state types
export interface ReaderState {
  words: string[];
  currentIndex: number;
  isPlaying: boolean;
  wpm: number;
  focalColor: FocalColor;
  progress: number;
}

export type FocalColor = 'red' | 'blue' | 'green' | 'purple';

export const FOCAL_COLORS: Record<FocalColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
};

// Content types
export interface ParsedContent {
  words: string[];
  metadata: ContentMetadata;
}

export interface ContentMetadata {
  title?: string;
  source: 'text' | 'pdf' | 'url' | 'epub';
  wordCount: number;
  contentHash: string;
}

// Reading progress
export interface ReadingProgress {
  contentHash: string;
  currentIndex: number;
  totalWords: number;
  lastRead: number;
  wpm: number;
}

// ORP calculation result
export interface ORPResult {
  before: string;
  focal: string;
  after: string;
  focalIndex: number;
}
