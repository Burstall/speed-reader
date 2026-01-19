'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore, PREMIUM_SERVICES } from '@/store/authStore';

function ReceiveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setCredential, customServices } = useAuthStore();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing...');
  const [serviceName, setServiceName] = useState('');

  useEffect(() => {
    const serviceId = searchParams.get('service');
    const cookie = searchParams.get('cookie');
    const customDomain = searchParams.get('domain');

    if (!serviceId || !cookie) {
      setStatus('error');
      setMessage('Missing service or cookie parameter');
      return;
    }

    // Find the service
    const allServices = [...PREMIUM_SERVICES, ...customServices];
    let service = allServices.find(s => s.id === serviceId);

    // Handle custom domains from extension
    if (!service && serviceId === 'custom' && customDomain) {
      // For custom domains, use the domain as the service name
      service = {
        id: `custom_${customDomain.replace(/\./g, '_')}`,
        name: customDomain,
        domain: customDomain,
        loginUrl: `https://${customDomain}`,
        cookieName: 'session',
      };
    }

    if (!service) {
      setStatus('error');
      setMessage('Unknown service');
      return;
    }

    setServiceName(service.name);

    // Save the cookie
    try {
      setCredential(service.id, cookie);
      setStatus('success');
      setMessage(`Connected to ${service.name}!`);

      // Redirect to home after delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setMessage('Failed to save credentials');
      console.error(err);
    }
  }, [searchParams, setCredential, customServices, router]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-8 max-w-md w-full shadow-xl text-center">
      {status === 'processing' && (
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
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You can now read {serviceName} articles offline
          </p>
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
          <p className="mt-4 text-gray-900 dark:text-white font-medium">Connection Failed</p>
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

export default function ReceivePage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <ReceiveContent />
      </Suspense>
    </div>
  );
}
