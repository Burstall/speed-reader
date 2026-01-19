'use client';

import { useState } from 'react';
import { useAuthStore, PREMIUM_SERVICES } from '@/store/authStore';
import { saveArticle } from '@/lib/offlineStore';

interface FeedArticle {
  title: string;
  url: string;
  excerpt?: string;
  date?: string;
  isPremium?: boolean;
}

export function FeedBrowser() {
  const [expanded, setExpanded] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const { credentials, getCredentialForDomain } = useAuthStore();

  // Get connected services
  const connectedServices = PREMIUM_SERVICES.filter(s => credentials[s.id]);

  const handleFetchFeed = async (url: string) => {
    setError('');
    setLoading(true);
    setArticles([]);

    try {
      const parsedUrl = new URL(url);
      const cookie = getCredentialForDomain(parsedUrl.hostname);

      const response = await fetch('/api/fetch/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, cookie }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch feed');
      }

      const data = await response.json();

      if (!data.articles || data.articles.length === 0) {
        setError('No articles found on this page');
        return;
      }

      setArticles(data.articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async (article: FeedArticle) => {
    setSaving(article.url);
    setError('');

    try {
      const parsedUrl = new URL(article.url);
      const cookie = getCredentialForDomain(parsedUrl.hostname);

      // Fetch the full article
      const response = await fetch('/api/fetch/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: article.url, cookie }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch article');
      }

      const data = await response.json();

      if (!data.words || data.words.length === 0) {
        throw new Error('No content found');
      }

      // Save to offline storage
      const parsedArticleUrl = new URL(article.url);
      await saveArticle({
        url: article.url,
        title: data.title || article.title,
        content: data.words.join(' '),
        wordCount: data.words.length,
        currentIndex: 0,
        source: parsedArticleUrl.hostname,
      });

      setSaved(prev => new Set(prev).add(article.url));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setSaving(null);
    }
  };

  const quickFeeds = [
    { label: 'Substack Inbox', url: 'https://substack.com/inbox' },
    { label: 'FT Home', url: 'https://www.ft.com' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          Browse Feeds
          {connectedServices.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
              {connectedServices.length} connected
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* Quick access to connected feeds */}
          {connectedServices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {connectedServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    if (service.id === 'substack') {
                      handleFetchFeed('https://substack.com/inbox');
                    } else {
                      handleFetchFeed(service.loginUrl.replace('/login', '').replace('/sign-in', ''));
                    }
                  }}
                  disabled={loading}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                             rounded transition-colors disabled:opacity-50"
                >
                  {service.name}
                </button>
              ))}
            </div>
          )}

          {/* Manual URL input */}
          <div className="flex gap-2">
            <input
              type="url"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="Feed or publication URL..."
              className="flex-1 px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                         rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => feedUrl && handleFetchFeed(feedUrl)}
              disabled={loading || !feedUrl}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : 'Load'}
            </button>
          </div>

          {/* Quick feed buttons */}
          <div className="flex flex-wrap gap-1">
            {quickFeeds.map(feed => (
              <button
                key={feed.url}
                onClick={() => handleFetchFeed(feed.url)}
                disabled={loading}
                className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300
                           hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
              >
                {feed.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading feed...
            </div>
          )}

          {/* Articles list */}
          {articles.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-xs text-gray-500">{articles.length} articles found</p>
              {articles.map((article, i) => (
                <div
                  key={article.url + i}
                  className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600
                                   dark:hover:text-blue-400 line-clamp-2"
                      >
                        {article.title}
                      </a>
                      {article.excerpt && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {article.date && (
                          <span className="text-xs text-gray-400">{article.date}</span>
                        )}
                        {article.isPremium && (
                          <span className="text-xs text-amber-600 dark:text-amber-500">Premium</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSaveArticle(article)}
                      disabled={saving === article.url || saved.has(article.url)}
                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-500
                                 disabled:opacity-50 transition-colors"
                      title={saved.has(article.url) ? 'Saved' : 'Save for offline'}
                    >
                      {saving === article.url ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : saved.has(article.url) ? (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Help text */}
          {articles.length === 0 && !loading && (
            <p className="text-xs text-gray-500 dark:text-gray-600">
              Browse articles from your premium subscriptions and save them for offline reading.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
