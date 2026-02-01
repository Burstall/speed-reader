import type { FocalColor } from '@/types';
import type { ServiceCredential, PremiumService } from '@/store/authStore';

export interface SyncPayload {
  version: 1;
  timestamp: number;
  settings: {
    wpm: number;
    focalColor: FocalColor;
    theme: 'dark' | 'light' | 'system';
  };
  credentials: Record<string, ServiceCredential>;
  customServices: PremiumService[];
}

// --- URL-safe base64 helpers ---

function toUrlSafeBase64(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafeBase64(urlSafe: string): string {
  let base64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return base64;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- Compression via native CompressionStream ---

async function compress(data: string): Promise<Uint8Array> {
  const blob = new Blob([data]);
  const cs = new CompressionStream('deflate');
  const stream = blob.stream().pipeThrough(cs);
  const compressed = await new Response(stream).arrayBuffer();
  return new Uint8Array(compressed);
}

async function decompress(data: Uint8Array): Promise<string> {
  const blob = new Blob([data]);
  const ds = new DecompressionStream('deflate');
  const stream = blob.stream().pipeThrough(ds);
  return new Response(stream).text();
}

/**
 * Encode settings and credentials into a compressed, URL-safe string.
 * Format: "z:" prefix + URL-safe base64 of deflate-compressed JSON.
 */
export async function encodeSync(payload: SyncPayload): Promise<string> {
  const json = JSON.stringify(payload);

  // Use native compression if available (all modern browsers)
  if (typeof CompressionStream !== 'undefined') {
    const compressed = await compress(json);
    return 'z:' + toUrlSafeBase64(uint8ToBase64(compressed));
  }

  // Fallback: plain base64 (no double-encoding)
  if (typeof window !== 'undefined') {
    return btoa(unescape(encodeURIComponent(json)));
  }
  return Buffer.from(json).toString('base64');
}

/**
 * Decode a sync string back into settings payload.
 * Handles both compressed ("z:" prefix) and legacy (plain base64) formats.
 */
export async function decodeSync(encoded: string): Promise<SyncPayload | null> {
  try {
    let json: string;

    if (encoded.startsWith('z:')) {
      // Compressed format
      const base64 = fromUrlSafeBase64(encoded.slice(2));
      const bytes = base64ToUint8(base64);
      json = await decompress(bytes);
    } else if (typeof window !== 'undefined') {
      // Legacy browser format: try proper UTF-8 decode first, then old double-encoded format
      try {
        json = decodeURIComponent(escape(atob(encoded)));
      } catch {
        // Old format: btoa(encodeURIComponent(json))
        json = decodeURIComponent(atob(encoded));
      }
    } else {
      json = Buffer.from(encoded, 'base64').toString('utf-8');
    }

    const payload = JSON.parse(json) as SyncPayload;

    // Validate version
    if (payload.version !== 1) {
      console.error('Unsupported sync version:', payload.version);
      return null;
    }

    // Basic validation
    if (!payload.settings || typeof payload.settings.wpm !== 'number') {
      console.error('Invalid sync payload structure');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Failed to decode sync data:', error);
    return null;
  }
}

/**
 * Generate a sync URL with encoded data as hash fragment.
 * Hash fragment keeps data client-side only (not sent to server).
 */
export async function generateSyncUrl(baseUrl: string, payload: SyncPayload): Promise<string> {
  const encoded = await encodeSync(payload);
  return `${baseUrl}/sync#${encoded}`;
}

/**
 * Extract sync data from URL hash.
 */
export async function extractSyncFromUrl(url: string): Promise<SyncPayload | null> {
  try {
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) return null;

    const encoded = url.substring(hashIndex + 1);
    if (!encoded) return null;

    return decodeSync(encoded);
  } catch {
    return null;
  }
}

/**
 * Get the current settings and credentials for syncing.
 */
export function gatherSyncData(
  readerState: { wpm: number; focalColor: FocalColor; theme: 'dark' | 'light' | 'system' },
  authState: { credentials: Record<string, ServiceCredential>; customServices: PremiumService[] }
): SyncPayload {
  return {
    version: 1,
    timestamp: Date.now(),
    settings: {
      wpm: readerState.wpm,
      focalColor: readerState.focalColor,
      theme: readerState.theme,
    },
    credentials: authState.credentials,
    customServices: authState.customServices,
  };
}
