'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, PREMIUM_SERVICES, type PremiumService } from '@/store/authStore';

export function PremiumAccess() {
  const [appUrl, setAppUrl] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [selectedService, setSelectedService] = useState<PremiumService | null>(null);
  const [manualCookie, setManualCookie] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const { credentials, customServices, setCredential, clearCredential } = useAuthStore();
  const allServices = [...PREMIUM_SERVICES, ...customServices];

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const connectedCount = Object.keys(credentials).length;

  const handleConnect = (service: PremiumService) => {
    setSelectedService(service);
    setManualCookie('');
    setShowInstructions(true);
  };

  const handleSaveCookie = () => {
    if (selectedService && manualCookie.trim()) {
      setCredential(selectedService.id, manualCookie);
      setSelectedService(null);
      setManualCookie('');
      setShowInstructions(false);
    }
  };

  const handleDisconnect = (serviceId: string) => {
    clearCredential(serviceId);
  };

  // Generate cookie capture bookmarklet for a service
  const getCookieBookmarklet = (service: PremiumService) => {
    return `javascript:(function(){var c=document.cookie;var u='${appUrl}/auth/receive?service=${service.id}&cookie='+encodeURIComponent(c);window.open(u,'_blank')})();`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Premium Access
          {connectedCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
              {connectedCount} connected
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
          {/* Service list */}
          <div className="space-y-2">
            {allServices.map((service) => {
              const cred = credentials[service.id];
              const isConnected = !!cred;

              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {service.name}
                      </p>
                      {isConnected && cred.savedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Connected {formatDate(cred.savedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isConnected ? (
                      <button
                        onClick={() => handleDisconnect(service.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Disconnect"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(service)}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connection modal/panel */}
          {selectedService && showInstructions && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Connect {selectedService.name}
                </h4>
                <button
                  onClick={() => {
                    setSelectedService(null);
                    setShowInstructions(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Step 1: Login */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Step 1: Log in to {selectedService.name}
                </p>
                <a
                  href={selectedService.loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-gray-800
                             border border-gray-300 dark:border-gray-700 rounded-lg text-sm
                             hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open {selectedService.name} Login
                </a>
              </div>

              {/* Step 2: Capture cookies */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Step 2: After logging in, capture your session
                </p>

                {/* Desktop Instructions */}
                <div className="hidden sm:block space-y-3">
                  {/* Warning about HttpOnly */}
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                    <p className="text-amber-800 dark:text-amber-200 font-medium">
                      ⚠️ Most sites use HttpOnly cookies
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      The bookmarklet below may not capture session cookies. If it doesn&apos;t work, use the manual DevTools method.
                    </p>
                  </div>

                  {/* Bookmarklet option */}
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Option A:</strong> Try the bookmarklet (drag to bookmarks bar):
                    </p>
                    <a
                      href={getCookieBookmarklet(selectedService)}
                      onClick={(e) => e.preventDefault()}
                      draggable
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600
                                 text-white text-xs font-medium rounded cursor-grab active:cursor-grabbing"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Capture {selectedService.name}
                    </a>
                  </div>

                  {/* DevTools method - recommended */}
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Option B (Recommended):</strong> Copy from DevTools
                    </p>
                    <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                      <li>On {selectedService.name}, press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">F12</kbd> to open DevTools</li>
                      <li>Go to <strong>Application</strong> tab → <strong>Cookies</strong> → select the site</li>
                      <li>Find <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{selectedService.cookieName}</code></li>
                      <li>Double-click the <strong>Value</strong> column and copy it</li>
                      <li>Paste in the box below</li>
                    </ol>
                  </div>
                </div>

                {/* Mobile Instructions */}
                <div className="sm:hidden space-y-2">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                    <p className="text-amber-800 dark:text-amber-200 font-medium">
                      📱 Mobile requires desktop browser
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      Session cookies can only be captured from a desktop browser. Connect from your computer, then use the app on mobile.
                    </p>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    If you have access to a desktop browser:
                  </p>
                  <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Open this app on your desktop</li>
                    <li>Connect to {selectedService.name}</li>
                    <li>Your credentials sync via local storage</li>
                  </ol>
                </div>

                {/* Manual entry - always visible now */}
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Paste cookie value:
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Look for <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{selectedService.cookieName}</code> or paste the full cookie string
                  </p>
                  <textarea
                    value={manualCookie}
                    onChange={(e) => setManualCookie(e.target.value)}
                    placeholder={`Paste ${selectedService.cookieName} value or full cookie string...`}
                    className="w-full h-20 p-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                               rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                  <button
                    onClick={handleSaveCookie}
                    disabled={!manualCookie.trim()}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                               text-white text-sm font-medium rounded transition-colors"
                  >
                    Save Cookie
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Help text */}
          <p className="text-xs text-gray-500 dark:text-gray-600">
            Connect to premium services to read paywalled articles offline.
            Cookies are stored locally on your device.
          </p>
        </div>
      )}
    </div>
  );
}
