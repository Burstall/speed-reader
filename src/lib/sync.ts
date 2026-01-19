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

/**
 * Encode settings and credentials into a compact string for QR codes.
 * Uses base64 encoding of JSON.
 */
export function encodeSync(payload: SyncPayload): string {
  const json = JSON.stringify(payload);
  // Use base64 encoding (works in browser)
  if (typeof window !== 'undefined') {
    return btoa(encodeURIComponent(json));
  }
  return Buffer.from(json).toString('base64');
}

/**
 * Decode a sync string back into settings payload.
 */
export function decodeSync(encoded: string): SyncPayload | null {
  try {
    let json: string;
    if (typeof window !== 'undefined') {
      json = decodeURIComponent(atob(encoded));
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
export function generateSyncUrl(baseUrl: string, payload: SyncPayload): string {
  const encoded = encodeSync(payload);
  return `${baseUrl}/sync#${encoded}`;
}

/**
 * Extract sync data from URL hash.
 */
export function extractSyncFromUrl(url: string): SyncPayload | null {
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
