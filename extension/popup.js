// Supported premium services
const SERVICES = {
  'substack.com': { id: 'substack', name: 'Substack' },
  'ft.com': { id: 'ft', name: 'Financial Times' },
  'spectator.co.uk': { id: 'spectator', name: 'The Spectator' },
  'economist.com': { id: 'economist', name: 'The Economist' },
  'nytimes.com': { id: 'nytimes', name: 'NY Times' },
  'wsj.com': { id: 'wsj', name: 'Wall Street Journal' },
};

// DOM elements
const domainEl = document.getElementById('domain');
const serviceBadgeEl = document.getElementById('serviceBadge');
const statusEl = document.getElementById('status');
const cookieCountEl = document.getElementById('cookieCount');
const captureBtn = document.getElementById('captureBtn');
const openAppBtn = document.getElementById('openAppBtn');
const appUrlInput = document.getElementById('appUrl');

let currentDomain = '';
let currentService = null;
let capturedCookies = '';

// Initialize
async function init() {
  // Load saved app URL
  const stored = await chrome.storage.local.get(['appUrl']);
  if (stored.appUrl) {
    appUrlInput.value = stored.appUrl;
  }

  // Save app URL on change
  appUrlInput.addEventListener('change', async () => {
    await chrome.storage.local.set({ appUrl: appUrlInput.value });
  });

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    showStatus('Cannot access this tab', 'error');
    return;
  }

  try {
    const url = new URL(tab.url);
    currentDomain = url.hostname;
    domainEl.textContent = currentDomain;

    // Check if this is a supported service
    currentService = findService(currentDomain);
    if (currentService) {
      serviceBadgeEl.textContent = currentService.name;
      serviceBadgeEl.classList.remove('hidden', 'not-supported');
      captureBtn.disabled = false;
    } else {
      serviceBadgeEl.textContent = 'Not a premium service';
      serviceBadgeEl.classList.remove('hidden');
      serviceBadgeEl.classList.add('not-supported');
      showStatus('This site is not a supported premium service. You can still capture cookies if needed.', 'info');
      captureBtn.disabled = false;
    }

    // Get cookie count
    const cookies = await chrome.cookies.getAll({ domain: getBaseDomain(currentDomain) });
    cookieCountEl.textContent = `${cookies.length} cookies available`;

  } catch (err) {
    showStatus(`Error: ${err.message}`, 'error');
  }

  // Button handlers
  captureBtn.addEventListener('click', captureCookies);
  openAppBtn.addEventListener('click', openApp);
}

// Find service by domain
function findService(domain) {
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  for (const [serviceDomain, service] of Object.entries(SERVICES)) {
    if (normalized === serviceDomain || normalized.endsWith('.' + serviceDomain)) {
      return service;
    }
  }
  return null;
}

// Get base domain for cookie lookup
function getBaseDomain(domain) {
  // Remove www. prefix
  let base = domain.replace(/^www\./, '');

  // For subdomains like example.substack.com, we want substack.com
  for (const serviceDomain of Object.keys(SERVICES)) {
    if (base.endsWith('.' + serviceDomain)) {
      return serviceDomain;
    }
  }

  return base;
}

// Capture cookies
async function captureCookies() {
  try {
    captureBtn.disabled = true;
    captureBtn.textContent = 'Capturing...';

    // Get all cookies for this domain and parent domains
    const baseDomain = getBaseDomain(currentDomain);
    const cookies = await chrome.cookies.getAll({ domain: baseDomain });

    // Also get cookies for the exact domain
    const exactCookies = await chrome.cookies.getAll({ domain: currentDomain });

    // Merge and dedupe
    const allCookies = [...cookies];
    for (const cookie of exactCookies) {
      if (!allCookies.find(c => c.name === cookie.name && c.domain === cookie.domain)) {
        allCookies.push(cookie);
      }
    }

    if (allCookies.length === 0) {
      showStatus('No cookies found. Make sure you are logged in.', 'error');
      captureBtn.disabled = false;
      captureBtn.textContent = 'Capture Cookies';
      return;
    }

    // Format as cookie header string
    capturedCookies = allCookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    showStatus(`Captured ${allCookies.length} cookies!`, 'success');
    captureBtn.textContent = 'Cookies Captured';
    openAppBtn.classList.remove('hidden');

  } catch (err) {
    showStatus(`Error: ${err.message}`, 'error');
    captureBtn.disabled = false;
    captureBtn.textContent = 'Capture Cookies';
  }
}

// Open app with cookies
function openApp() {
  const appUrl = appUrlInput.value.trim();
  if (!appUrl) {
    showStatus('Please enter your Speed Reader URL', 'error');
    appUrlInput.focus();
    return;
  }

  // Determine service ID
  const serviceId = currentService?.id || 'custom';

  // Build URL with cookie data
  const targetUrl = new URL('/auth/receive', appUrl);
  targetUrl.searchParams.set('service', serviceId);
  targetUrl.searchParams.set('cookie', capturedCookies);

  // If it's a custom domain, include the domain name
  if (!currentService) {
    targetUrl.searchParams.set('domain', currentDomain);
  }

  // Open in new tab
  chrome.tabs.create({ url: targetUrl.toString() });
}

// Show status message
function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove('hidden');
}

// Start
init();
