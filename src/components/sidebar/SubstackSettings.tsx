'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export function SubstackSettings() {
  const { substackCookie, setSubstackCookie, clearSubstackCookie } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [cookieInput, setCookieInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const hasCookie = substackCookie.length > 0;

  const handleSave = () => {
    if (cookieInput.trim()) {
      setSubstackCookie(cookieInput.trim());
      setCookieInput('');
      setIsEditing(false);
    }
  };

  const handleClear = () => {
    clearSubstackCookie();
    setCookieInput('');
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Substack Login</span>
        {hasCookie && !isEditing && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="flex flex-col gap-2">
          {hasCookie ? (
            <div className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-800/50 rounded-lg">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-400">Connected</span>
              <button
                onClick={() => setIsEditing(true)}
                className="ml-auto text-xs text-gray-500 hover:text-white"
              >
                Update
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-2 p-2 border border-gray-700
                         rounded-lg text-sm text-gray-400 hover:text-white hover:border-gray-500
                         transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Add Session Cookie
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={cookieInput}
            onChange={(e) => setCookieInput(e.target.value)}
            placeholder="Paste your substack.sid cookie value here..."
            className="w-full h-20 p-2 bg-gray-900 border border-gray-700 rounded-lg
                       text-white placeholder-gray-600 text-xs font-mono resize-none
                       focus:outline-none focus:border-gray-500 transition-colors"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!cookieInput.trim()}
              className="flex-1 py-1.5 bg-white text-black text-sm font-medium rounded-lg
                         hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setCookieInput('');
              }}
              className="px-3 py-1.5 border border-gray-700 text-sm text-gray-400
                         rounded-lg hover:text-white hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-left"
          >
            {showHelp ? 'Hide instructions' : 'How to get your cookie?'}
          </button>

          {showHelp && (
            <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-400 space-y-2">
              <p><strong className="text-gray-300">1.</strong> Log into Substack in your browser</p>
              <p><strong className="text-gray-300">2.</strong> Open DevTools (F12 or Cmd+Opt+I)</p>
              <p><strong className="text-gray-300">3.</strong> Go to Application → Cookies</p>
              <p><strong className="text-gray-300">4.</strong> Find <code className="text-orange-400">substack.sid</code></p>
              <p><strong className="text-gray-300">5.</strong> Copy the entire value and paste above</p>
              <p className="pt-2 text-gray-500">
                Your cookie is stored locally and only used to fetch your subscribed content.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
