'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReadingList } from '@/hooks/useReadingList';
import { useAuthStore } from '@/store/authStore';

function ShareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { save } = useReadingList();
  const { getCredentialForDomain } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'saving' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [articleTitle, setArticleTitle] = useState('');

  useEffect(() => {
    const url = searchParams.get('url') || searchParams.get('text');

    if (!url) {
      setStatus('error');
      setMessage('No URL provided');
      return;
    }

    // Extract URL from text if needed (sometimes share includes extra text)
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    const cleanUrl = urlMatch ? urlMatch[0] : url;

    if (!cleanUrl.startsWith('http')) {
      setStatus('error');
      setMessage('Invalid URL');
      return;
    }

    setStatus('saving');
    setMessage('Fetching article...');

    // Get stored cookie for this domain
    let cookie: string | null = null;
    try {
      const domain = new URL(cleanUrl).hostname;
      cookie = getCredentialForDomain(domain);
    } catch {
      // URL parsing failed, continue without cookie
    }

    // Fetch and save the article
    fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, cookie }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.error) {
          throw new Error(data.error);
        }

        setMessage('Saving to reading list...');
        setArticleTitle(data.title);

        await save(data.url, data.title, data.content, data.source);

        setStatus('success');
        setMessage('Article saved!');

        // Redirect to home after a short delay
        setTimeout(() => {
          router.push('/');
        }, 1500);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Failed to save article');
      });
  }, [searchParams, save, router, getCredentialForDomain]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-8 max-w-md w-full shadow-xl text-center">
      {status === 'loading' && (
        <>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Initializing...</p>
        </>
      )}

      {status === 'saving' && (
        <>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mt-4 text-gray-900 dark:text-white font-medium">{message}</p>
          {articleTitle && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 truncate">
              {articleTitle}
            </p>
          )}
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
            Redirecting to reader...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="mt-4 text-gray-900 dark:text-white font-medium">Failed to save</p>
          <p className="mt-2 text-sm text-red-500">{message}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300
                       hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Go to Reader
          </button>
        </>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-8 max-w-md w-full shadow-xl text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  );
}

export default function SharePage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <ShareContent />
      </Suspense>
    </div>
  );
}
