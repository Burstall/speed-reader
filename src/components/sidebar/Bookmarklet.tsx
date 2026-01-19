'use client';

import { useState, useEffect } from 'react';

export function Bookmarklet() {
  const [appUrl, setAppUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  // The bookmarklet code - opens the share page with the current URL
  const bookmarkletCode = `javascript:(function(){window.open('${appUrl}/share?url='+encodeURIComponent(location.href),'_blank')})();`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = bookmarkletCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Quick Save</span>
      </div>

      <div className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Drag this button to your bookmarks bar to save articles with one click:
        </p>

        <div className="flex items-center gap-2">
          <a
            href={bookmarkletCode}
            onClick={(e) => e.preventDefault()}
            draggable
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600
                       text-white text-sm font-medium rounded-lg cursor-grab active:cursor-grabbing
                       hover:from-blue-700 hover:to-purple-700 transition-colors"
            title="Drag to bookmarks bar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save to Speed Reader
          </a>

          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Copy bookmarklet code"
          >
            {copied ? (
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-600 mt-3">
          On mobile, use the Share button and select &quot;Speed Reader&quot;
        </p>
      </div>
    </div>
  );
}
