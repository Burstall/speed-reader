'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, PREMIUM_SERVICES, type PremiumService } from '@/store/authStore';

export function PremiumAccess() {
  const [appUrl, setAppUrl] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [showExperimental, setShowExperimental] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [selectedService, setSelectedService] = useState<PremiumService | null>(null);
  const [manualCookie, setManualCookie] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const { credentials, customServices, hiddenServices, setCredential, clearCredential, hideService, showService } = useAuthStore();
  const allServices = [...PREMIUM_SERVICES, ...customServices];

  // Split services into categories
  const testedServices = allServices.filter(s => !s.experimental && !hiddenServices.includes(s.id));
  const experimentalServices = allServices.filter(s => s.experimental && !hiddenServices.includes(s.id));
  const hiddenServicesList = allServices.filter(s => hiddenServices.includes(s.id));

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

  // Render a service item
  const renderService = (service: PremiumService, showHideButton = true) => {
    const cred = credentials[service.id];
    const isConnected = !!cred;
    const isHidden = hiddenServices.includes(service.id);

    return (
      <div
        key={service.id}
        className="group flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {service.name}
              {service.experimental && (
                <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-500">Beta</span>
              )}
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
            <>
              <button
                onClick={() => handleConnect(service)}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Connect
              </button>
              {showHideButton && !isHidden && (
                <button
                  onClick={() => hideService(service.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  title="Hide this service"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              )}
              {isHidden && (
                <button
                  onClick={() => showService(service.id)}
                  className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                  title="Show this service"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
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
          {/* Tested services */}
          <div className="space-y-2">
            {testedServices.map((service) => renderService(service))}
          </div>

          {/* Experimental services section */}
          {experimentalServices.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowExperimental(!showExperimental)}
                className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${showExperimental ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>Experimental ({experimentalServices.length})</span>
                <span className="text-amber-600 dark:text-amber-500">Beta</span>
              </button>

              {showExperimental && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-amber-600 dark:text-amber-500 px-1">
                    These connectors are untested and may not work correctly.
                  </p>
                  {experimentalServices.map((service) => renderService(service))}
                </div>
              )}
            </div>
          )}

          {/* Hidden services section */}
          {hiddenServicesList.length > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowHidden(!showHidden)}
                className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${showHidden ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>Hidden ({hiddenServicesList.length})</span>
              </button>

              {showHidden && (
                <div className="mt-2 space-y-2">
                  {hiddenServicesList.map((service) => renderService(service, false))}
                </div>
              )}
            </div>
          )}

          {/* Connection modal/panel */}
          {selectedService && showInstructions && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Connect {selectedService.name}
                  {selectedService.experimental && (
                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-500">Beta</span>
                  )}
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

              {/* Experimental warning */}
              {selectedService.experimental && (
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    This connector is experimental
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    Cookie names and authentication methods have not been verified. Results may vary.
                  </p>
                </div>
              )}

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
                      Most sites use HttpOnly cookies
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
                    {selectedService.id === 'ft' ? (
                      <>
                        <div className="mb-2 p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded text-xs text-amber-800 dark:text-amber-300">
                          <strong>FT requires multiple cookies.</strong> Use the Chrome extension for best results.
                        </div>
                        <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                          <li>On ft.com, press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">F12</kbd> to open DevTools</li>
                          <li>Go to <strong>Network</strong> tab, refresh the page</li>
                          <li>Click any request to ft.com</li>
                          <li>Find <strong>Request Headers</strong> → <strong>Cookie</strong></li>
                          <li>Copy the <strong>entire</strong> cookie string and paste below</li>
                        </ol>
                      </>
                    ) : (
                      <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                        <li>On {selectedService.name}, press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">F12</kbd> to open DevTools</li>
                        <li>Go to <strong>Application</strong> tab → <strong>Cookies</strong> → select the site</li>
                        <li>Find <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{selectedService.cookieName}</code></li>
                        <li>Double-click the <strong>Value</strong> column and copy it</li>
                        <li>Paste in the box below</li>
                      </ol>
                    )}
                  </div>
                </div>

                {/* Mobile Instructions */}
                <div className="sm:hidden space-y-2">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                    <p className="text-amber-800 dark:text-amber-200 font-medium">
                      Mobile requires desktop browser
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
                    {selectedService.id === 'ft'
                      ? 'Paste the full cookie string from Network tab Request Headers'
                      : <>Look for <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{selectedService.cookieName}</code> or paste the full cookie string</>
                    }
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
