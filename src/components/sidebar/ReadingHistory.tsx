'use client';

import { useState } from 'react';
import { useHistoryStore, type ReadingItem } from '@/store/historyStore';
import { useReaderStore } from '@/store/readerStore';
import { useAuthStore } from '@/store/authStore';

export function ReadingHistory() {
  const { items, removeItem, clearHistory } = useHistoryStore();
  const { setContent, jumpTo } = useReaderStore();
  const { getCredentialForDomain } = useAuthStore();
  const [resumingId, setResumingId] = useState<string | null>(null);

  if (items.length === 0) {
    return null;
  }

  const handleResume = async (item: ReadingItem) => {
    setResumingId(item.id);

    try {
      // If we have stored content, use it directly
      if (item.content) {
        setContent(item.content, {
          title: item.title,
          source: item.source,
          sourceUrl: item.sourceUrl,
        });
        // Wait for next tick to ensure content is set
        setTimeout(() => {
          jumpTo(item.currentIndex);
          setResumingId(null);
        }, 50);
        return;
      }

      // If we have a URL, refetch the content
      if (item.sourceUrl) {
        const parsedUrl = new URL(item.sourceUrl);
        const cookie = getCredentialForDomain(parsedUrl.hostname);

        const response = await fetch('/api/fetch/article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: item.sourceUrl,
            cookie: cookie || undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.words && data.words.length > 0) {
            setContent(data.words.join(' '), {
              title: item.title,
              source: 'url',
              sourceUrl: item.sourceUrl,
            });
            setTimeout(() => {
              jumpTo(item.currentIndex);
              setResumingId(null);
            }, 50);
            return;
          }
        }
      }

      // Cannot resume - no content or URL
      setResumingId(null);
      alert('Cannot resume: content not available. Please reload the source.');
    } catch {
      setResumingId(null);
      alert('Failed to resume reading.');
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getSourceIcon = (source: ReadingItem['source']) => {
    switch (source) {
      case 'pdf':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'url':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Recent</span>
        <button
          onClick={clearHistory}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {items.slice(0, 5).map((item) => {
          const progress = Math.round((item.currentIndex / item.wordCount) * 100);
          const isResuming = resumingId === item.id;
          const canResume = item.content || item.sourceUrl;

          return (
            <div
              key={item.id}
              onClick={() => canResume && handleResume(item)}
              title={item.sourceUrl || item.preview}
              className={`
                group flex items-center gap-2 p-2 rounded-lg transition-colors
                ${canResume
                  ? 'cursor-pointer hover:bg-gray-800/50'
                  : 'cursor-default opacity-75'
                }
                ${isResuming ? 'bg-gray-800/50' : ''}
              `}
            >
              {/* Icon / Loading */}
              <span className="text-gray-600 flex-shrink-0">
                {isResuming ? (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  getSourceIcon(item.source)
                )}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate" title={item.title}>
                  {item.title}
                </p>
                <p className="text-xs text-gray-600">
                  {progress}% • {formatTime(item.lastRead)}
                  {!canResume && ' • Cannot resume'}
                </p>
              </div>

              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-600
                           hover:text-red-500 transition-all"
                aria-label="Remove from history"
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
