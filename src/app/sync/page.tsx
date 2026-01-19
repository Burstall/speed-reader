'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { decodeSync, type SyncPayload } from '@/lib/sync';
import { useReaderStore } from '@/store/readerStore';
import { useAuthStore, PREMIUM_SERVICES } from '@/store/authStore';

export default function SyncPage() {
  const router = useRouter();
  const [syncData, setSyncData] = useState<SyncPayload | null>(null);
  const [error, setError] = useState('');
  const [imported, setImported] = useState(false);

  const { setWpm, setFocalColor, setTheme } = useReaderStore();
  const { setCredential, customServices: existingCustomServices } = useAuthStore();

  useEffect(() => {
    // Get hash from URL (client-side only)
    const hash = window.location.hash.substring(1);
    if (!hash) {
      setError('No sync data found in URL');
      return;
    }

    const data = decodeSync(hash);
    if (!data) {
      setError('Invalid or corrupted sync data');
      return;
    }

    setSyncData(data);
  }, []);

  const handleImport = () => {
    if (!syncData) return;

    // Apply settings
    setWpm(syncData.settings.wpm);
    setFocalColor(syncData.settings.focalColor);
    setTheme(syncData.settings.theme);

    // Apply credentials
    Object.entries(syncData.credentials).forEach(([serviceId, cred]) => {
      setCredential(serviceId, cred.cookie);
    });

    // Note: Custom services would need addCustomService, but keeping it simple

    setImported(true);

    // Redirect after short delay
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getServiceName = (serviceId: string) => {
    const service = PREMIUM_SERVICES.find(s => s.id === serviceId);
    return service?.name || serviceId;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Sync Failed</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (imported) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Settings Imported!</h1>
          <p className="text-gray-400">Redirecting to reader...</p>
        </div>
      </div>
    );
  }

  if (!syncData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const credentialCount = Object.keys(syncData.credentials).length;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Import Settings</h1>
          <p className="text-sm text-gray-400">
            Exported {formatDate(syncData.timestamp)}
          </p>
        </div>

        {/* Settings preview */}
        <div className="space-y-4 mb-6">
          <div className="p-3 bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Reader Settings</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 bg-gray-900 rounded">
                <p className="text-white font-bold">{syncData.settings.wpm}</p>
                <p className="text-xs text-gray-500">WPM</p>
              </div>
              <div className="text-center p-2 bg-gray-900 rounded">
                <p className="text-white font-bold capitalize">{syncData.settings.focalColor}</p>
                <p className="text-xs text-gray-500">Color</p>
              </div>
              <div className="text-center p-2 bg-gray-900 rounded">
                <p className="text-white font-bold capitalize">{syncData.settings.theme}</p>
                <p className="text-xs text-gray-500">Theme</p>
              </div>
            </div>
          </div>

          {credentialCount > 0 && (
            <div className="p-3 bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Premium Access ({credentialCount} service{credentialCount !== 1 ? 's' : ''})
              </h3>
              <div className="space-y-1">
                {Object.keys(syncData.credentials).map((serviceId) => (
                  <div key={serviceId} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-300">{getServiceName(serviceId)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleImport}
            className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Import All Settings
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-gray-800 text-gray-300 font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-600 text-center mt-4">
          This will overwrite your current settings on this device.
        </p>
      </div>
    </div>
  );
}
