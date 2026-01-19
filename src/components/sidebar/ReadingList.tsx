'use client';

import { useState } from 'react';
import { useReadingList } from '@/hooks/useReadingList';
import { useReaderStore } from '@/store/readerStore';
import type { SavedArticle } from '@/lib/offlineStore';

export function ReadingList() {
  const { articles, isLoading, remove, refresh } = useReadingList();
  const { setContent, jumpTo } = useReaderStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRead = async (article: SavedArticle) => {
    setLoadingId(article.id);
    try {
      setContent(article.content, {
        title: article.title,
        source: 'url',
        sourceUrl: article.url,
      });
      // Small delay to ensure content is set
      setTimeout(() => {
        if (article.currentIndex > 0) {
          jumpTo(article.currentIndex);
        }
        setLoadingId(null);
      }, 50);
    } catch {
      setLoadingId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatProgress = (article: SavedArticle) => {
    if (article.currentIndex === 0) return 'Not started';
    const percent = Math.round((article.currentIndex / article.wordCount) * 100);
    return `${percent}%`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Reading List</span>
        </div>
        <div className="text-sm text-gray-400 dark:text-gray-600">Loading...</div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Reading List</span>
        </div>
        <div className="text-center py-4 text-sm text-gray-400 dark:text-gray-600">
          <p>No saved articles</p>
          <p className="text-xs mt-1">Save articles for offline reading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Reading List ({articles.length})
        </span>
        <button
          onClick={refresh}
          className="text-xs text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {articles.map((article) => {
          const isLoadingThis = loadingId === article.id;

          return (
            <div
              key={article.id}
              className="group relative"
            >
              <button
                onClick={() => handleRead(article)}
                disabled={isLoadingThis}
                className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50
                           transition-colors disabled:opacity-50"
              >
                <div className="flex items-start gap-2">
                  {/* Offline indicator */}
                  <span className="flex-shrink-0 mt-1" title="Available offline">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium">
                      {article.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {article.source}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-600">
                      <span>{article.wordCount.toLocaleString()} words</span>
                      <span>•</span>
                      <span>{formatProgress(article)}</span>
                      <span>•</span>
                      <span>{formatDate(article.savedAt)}</span>
                    </div>
                  </div>

                  {isLoadingThis && (
                    <div className="flex-shrink-0">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(article.id);
                }}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1
                           text-gray-400 hover:text-red-500 transition-all"
                title="Remove from reading list"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
