// Supported premium services
const SERVICES = {
  'substack.com': { id: 'substack', name: 'Substack' },
  'ft.com': { id: 'ft', name: 'Financial Times' },
  'spectator.co.uk': { id: 'spectator', name: 'The Spectator' },
  'economist.com': { id: 'economist', name: 'The Economist' },
  'nytimes.com': { id: 'nytimes', name: 'NY Times' },
  'wsj.com': { id: 'wsj', name: 'Wall Street Journal' },
};

// Important cookie name patterns for filtering large cookie strings
const IMPORTANT_COOKIE_PATTERNS = [
  'session', 'token', 'auth', 'sid', 'jwt', 'login', 'user', 'account',
];

let appUrl = '';
let currentTab = null;

// DOM elements
const setupView = document.getElementById('setupView');
const appView = document.getElementById('appView');
const articleView = document.getElementById('articleView');

async function init() {
  // Load saved app URL with try/catch for storage permission
  try {
    const stored = await chrome.storage.local.get(['appUrl']);
    if (stored.appUrl) {
      appUrl = stored.appUrl;
    }
  } catch (err) {
    console.error('Failed to read storage:', err);
  }

  // Get current tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
  } catch (err) {
    console.error('Failed to get tab:', err);
  }

  if (!currentTab?.url) {
    showSetupView();
    return;
  }

  // Detect state
  const tabUrl = currentTab.url;
  const tabTitle = currentTab.title || '';

  if (appUrl && isSameOrigin(tabUrl, appUrl)) {
    // On the Speed Reader app
    showAppView();
  } else if (appUrl) {
    // App URL saved, on another page
    showArticleView();
  } else if (tabTitle.toLowerCase().includes('speed reader')) {
    // First-time detection: page title matches
    showAppView();
  } else {
    showSetupView();
  }
}

function isSameOrigin(url1, url2) {
  try {
    return new URL(url1).origin === new URL(url2).origin;
  } catch {
    return false;
  }
}

// --- State A: Setup View ---
function showSetupView() {
  setupView.classList.remove('hidden');

  const setupUrlInput = document.getElementById('setupUrl');
  const saveSetupBtn = document.getElementById('saveSetupBtn');

  if (appUrl) {
    setupUrlInput.value = appUrl;
  }

  saveSetupBtn.addEventListener('click', async () => {
    const url = setupUrlInput.value.trim();
    if (!url) return;
    try {
      new URL(url); // validate
    } catch {
      return;
    }
    appUrl = url;
    await chrome.storage.local.set({ appUrl });
    // Switch to article view now that URL is saved
    setupView.classList.add('hidden');
    showArticleView();
  });
}

// --- State B: App View ---
function showAppView() {
  appView.classList.remove('hidden');

  const setDefaultBtn = document.getElementById('setDefaultBtn');
  const appViewUrlEl = document.getElementById('appViewUrl');

  if (appUrl) {
    appViewUrlEl.textContent = `Saved: ${appUrl}`;
    setDefaultBtn.textContent = 'Update Default URL';
  }

  setDefaultBtn.addEventListener('click', async () => {
    if (!currentTab?.url) return;
    try {
      const origin = new URL(currentTab.url).origin;
      appUrl = origin;
      await chrome.storage.local.set({ appUrl: origin });
      appViewUrlEl.textContent = `Saved: ${origin}`;
      setDefaultBtn.textContent = 'Saved!';
      setDefaultBtn.disabled = true;
    } catch (err) {
      console.error('Failed to save URL:', err);
    }
  });
}

// --- State C: Article View ---
function showArticleView() {
  articleView.classList.remove('hidden');

  const articleDomainEl = document.getElementById('articleDomain');
  const serviceBadgeEl = document.getElementById('serviceBadge');
  const statusEl = document.getElementById('status');
  const readBtn = document.getElementById('readBtn');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  const appUrlInput = document.getElementById('appUrl');
  const saveUrlBtn = document.getElementById('saveUrlBtn');

  // Show current domain
  let currentDomain = '';
  let currentService = null;
  try {
    const url = new URL(currentTab.url);
    currentDomain = url.hostname;
    articleDomainEl.textContent = currentDomain;
    currentService = findService(currentDomain);
    if (currentService) {
      serviceBadgeEl.textContent = currentService.name;
      serviceBadgeEl.classList.remove('hidden');
    }
  } catch {
    articleDomainEl.textContent = 'Unknown page';
  }

  // Populate settings input
  if (appUrl) {
    appUrlInput.value = appUrl;
  }

  // Settings toggle
  settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  // Save URL from settings
  saveUrlBtn.addEventListener('click', async () => {
    const url = appUrlInput.value.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      return;
    }
    appUrl = url;
    await chrome.storage.local.set({ appUrl });
    saveUrlBtn.textContent = 'Saved!';
    setTimeout(() => { saveUrlBtn.textContent = 'Save URL'; }, 1500);
  });

  // "Read in Speed Reader" click handler
  readBtn.addEventListener('click', async () => {
    if (!appUrl) {
      showStatus(statusEl, 'Enter your Speed Reader URL in settings below', 'error');
      settingsPanel.classList.remove('hidden');
      return;
    }

    readBtn.disabled = true;
    readBtn.textContent = 'Opening...';

    try {
      if (currentService) {
        // Premium service: capture cookies and send with article
        showStatus(statusEl, 'Capturing cookies...', 'loading');
        const cookieStr = await captureCookies(currentDomain);

        const targetUrl = new URL('/auth/receive', appUrl);
        targetUrl.searchParams.set('service', currentService.id);
        targetUrl.searchParams.set('cookie', cookieStr);
        targetUrl.searchParams.set('article', currentTab.url);

        chrome.tabs.create({ url: targetUrl.toString() });
      } else {
        // Non-premium: just send article URL directly
        const targetUrl = new URL('/', appUrl);
        targetUrl.searchParams.set('article', currentTab.url);

        chrome.tabs.create({ url: targetUrl.toString() });
      }
    } catch (err) {
      showStatus(statusEl, `Error: ${err.message}`, 'error');
      readBtn.disabled = false;
      readBtn.textContent = 'Read in Speed Reader';
    }
  });
}

// --- Helpers ---

function findService(domain) {
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  for (const [serviceDomain, service] of Object.entries(SERVICES)) {
    if (normalized === serviceDomain || normalized.endsWith('.' + serviceDomain)) {
      return service;
    }
  }
  return null;
}

function getBaseDomain(domain) {
  let base = domain.replace(/^www\./, '');
  for (const serviceDomain of Object.keys(SERVICES)) {
    if (base.endsWith('.' + serviceDomain)) {
      return serviceDomain;
    }
  }
  return base;
}

async function captureCookies(domain) {
  const baseDomain = getBaseDomain(domain);

  // Get cookies for base domain and exact domain
  const [baseCookies, exactCookies] = await Promise.all([
    chrome.cookies.getAll({ domain: baseDomain }),
    chrome.cookies.getAll({ domain: domain }),
  ]);

  // Merge and dedupe
  const allCookies = [...baseCookies];
  for (const cookie of exactCookies) {
    if (!allCookies.find(c => c.name === cookie.name && c.domain === cookie.domain)) {
      allCookies.push(cookie);
    }
  }

  // Format as cookie header string
  let cookieStr = allCookies
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  // If cookie string is too long for URL, filter to important cookies only
  if (cookieStr.length > 4000) {
    const importantCookies = allCookies.filter(c => {
      const nameLower = c.name.toLowerCase();
      return IMPORTANT_COOKIE_PATTERNS.some(p => nameLower.includes(p)) || c.httpOnly;
    });
    if (importantCookies.length > 0) {
      cookieStr = importantCookies
        .map(c => `${c.name}=${c.value}`)
        .join('; ');
    }
  }

  return cookieStr;
}

function showStatus(el, message, type) {
  el.textContent = message;
  el.className = `status ${type}`;
  el.classList.remove('hidden');
}

// Start
init();
