'use client';

import { useState } from 'react';
import { useReaderStore } from '@/store/readerStore';

export function TextInput() {
  const [text, setText] = useState('');
  const { setContent, words } = useReaderStore();

  const handleLoad = () => {
    if (text.trim()) {
      // Try to extract a title from first line if it looks like a title
      const firstLine = text.trim().split('\n')[0].trim();
      const isTitle = firstLine.length < 100 && !firstLine.endsWith('.');
      const title = isTitle ? firstLine : undefined;

      setContent(text.trim(), {
        title,
        source: 'text',
      });
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to load
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleLoad();
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="text-input" className="text-sm text-gray-400">
        Paste your text
      </label>

      <textarea
        id="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste article, book chapter, or any text you want to speed read..."
        className="w-full h-48 p-3 bg-gray-900 border border-gray-700 rounded-lg
                   text-white placeholder-gray-600 text-sm resize-none
                   focus:outline-none focus:border-gray-500 transition-colors"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">
          {wordCount > 0 ? `${wordCount.toLocaleString()} words` : 'No content'}
        </span>

        <button
          onClick={handleLoad}
          disabled={!text.trim()}
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg
                     hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors"
        >
          Load Content
        </button>
      </div>

      {words.length > 0 && (
        <p className="text-xs text-gray-600">
          Tip: Press Ctrl+Enter to load quickly
        </p>
      )}
    </div>
  );
}
