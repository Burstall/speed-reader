'use client';

import { Component, useState, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useReaderStore } from '@/store/readerStore';
import { useAuthStore, PREMIUM_SERVICES } from '@/store/authStore';
import { gatherSyncData, generateSyncUrl } from '@/lib/sync';

// Dynamic import for QR code library
const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeSVG),
  { ssr: false, loading: () => <div className="w-[180px] h-[180px] bg-gray-100 animate-pulse rounded" /> }
);

// Error boundary to catch QR encoding overflow
class QRErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function DeviceSync() {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncUrl, setSyncUrl] = useState('');

  const { wpm, focalColor, theme } = useReaderStore();
  const { credentials, customServices } = useAuthStore();

  const credentialCount = Object.keys(credentials).length;

  useEffect(() => {
    if (expanded && typeof window !== 'undefined') {
      const syncData = gatherSyncData(
        { wpm, focalColor, theme },
        { credentials, customServices }
      );
      generateSyncUrl(window.location.origin, syncData).then((url) => {
        setSyncUrl(url);
      });
    }
  }, [expanded, wpm, focalColor, theme, credentials, customServices]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(syncUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = PREMIUM_SERVICES.find(s => s.id === serviceId);
    return service?.name || serviceId;
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Sync to Mobile
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg">
            {syncUrl ? (
              <QRErrorBoundary
                fallback={
                  <div className="w-[180px] h-[180px] flex items-center justify-center">
                    <p className="text-xs text-red-600 text-center px-2">
                      Payload too large for QR code. Use &quot;Copy Link&quot; below instead.
                    </p>
                  </div>
                }
              >
                <QRCodeSVG
                  value={syncUrl}
                  size={180}
                  level="L"
                  includeMargin={false}
                />
              </QRErrorBoundary>
            ) : (
              <div className="w-[180px] h-[180px] bg-gray-100 animate-pulse rounded" />
            )}
            <p className="text-xs text-gray-600 text-center">
              Scan with your phone camera or copy link below
            </p>
          </div>

          {/* What's included */}
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Includes:</p>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Reading speed: {wpm} WPM
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Focal color: <span className="capitalize">{focalColor}</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Theme: <span className="capitalize">{theme}</span>
              </li>
              {credentialCount > 0 && (
                <li className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Premium: {Object.keys(credentials).map(getServiceName).join(', ')}
                </li>
              )}
            </ul>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full py-2 px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
                       text-gray-800 dark:text-gray-200 text-sm rounded-lg transition-colors
                       flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-600 text-center">
            QR codes contain your session cookies. Don&apos;t share publicly.
          </p>
        </div>
      )}
    </div>
  );
}
