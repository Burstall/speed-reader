'use client';

import { useState } from 'react';
import { useReaderStore } from '@/store/readerStore';
import { useAuthStore } from '@/store/authStore';

export function UrlInput() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [usingPremium, setUsingPremium] = useState(false);
  const [wasPaywalled, setWasPaywalled] = useState(false);
  const { setContent } = useReaderStore();
  const { getCredentialForDomain, getServiceForDomain } = useAuthStore();

  const isValidUrl = (urlString: string) => {
    try {
      const parsed = new URL(urlString);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleFetch = async () => {
    setError('');
    setArticleTitle('');
    setUsingPremium(false);
    setWasPaywalled(false);

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url.trim())) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);

    try {
      // Get stored cookie for this domain if available
      const parsedUrl = new URL(url.trim());
      const cookie = getCredentialForDomain(parsedUrl.hostname);
      const service = getServiceForDomain(parsedUrl.hostname);

      if (cookie && service) {
        setUsingPremium(true);
        console.log(`[UrlInput] Using ${service.name} credentials, cookie length: ${cookie.length}`);
      } else if (service) {
        console.log(`[UrlInput] ${service.name} detected but no credentials stored`);
      }

      const response = await fetch('/api/fetch/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          cookie: cookie || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch article');
      }

      const data = await response.json();

      if (!data.words || data.words.length === 0) {
        throw new Error('No readable content found in article');
      }

      // Check if content was paywalled
      if (data.metadata?.isPaywalled) {
        setWasPaywalled(true);
        console.log('[UrlInput] Content appears to be paywalled - cookie may be expired');
      }

      const title = data.title || new URL(url.trim()).hostname;
      setContent(data.words.join(' '), {
        title,
        source: 'url',
        sourceUrl: url.trim(),
      });
      setArticleTitle(title);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFetch();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="url-input" className="text-sm text-gray-400">
        Article URL
      </label>

      <div className="flex gap-2">
        <input
          id="url-input"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.substack.com/p/..."
          disabled={isLoading}
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg
                     text-white placeholder-gray-600 text-sm
                     focus:outline-none focus:border-gray-500 transition-colors
                     disabled:opacity-50"
        />

        <button
          onClick={handleFetch}
          disabled={isLoading || !url.trim()}
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg
                     hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors whitespace-nowrap"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </span>
          ) : (
            'Fetch'
          )}
        </button>
      </div>

      {/* Status */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {articleTitle && !error && (
        <div>
          <p className="text-sm text-green-500 truncate">{articleTitle}</p>
          {usingPremium && !wasPaywalled && (
            <p className="text-xs text-blue-400">Fetched with premium access</p>
          )}
          {wasPaywalled && (
            <p className="text-xs text-orange-400">
              Paywall detected - try reconnecting in Premium Access
            </p>
          )}
        </div>
      )}

      {isLoading && usingPremium && (
        <p className="text-xs text-blue-400">Using premium credentials...</p>
      )}

      <p className="text-xs text-gray-600">
        Works with Substack, Medium, and most article pages
      </p>
    </div>
  );
}
