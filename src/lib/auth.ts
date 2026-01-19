/**
 * Authentication utilities using Web Crypto API
 * Compatible with Edge Runtime (middleware) and Node.js (API routes)
 */

const APP_SECRET = process.env.APP_SECRET || 'dev-secret-change-in-production';

/**
 * Create HMAC-SHA256 signature using Web Crypto API
 */
async function createSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(APP_SECRET);
  const message = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, message);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate a session token
 * Token format: sessionId.expiry.signature
 */
export async function validateSessionToken(token: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [sessionId, expiryStr, signature] = parts;
  const expiry = parseInt(expiryStr, 10);

  // Check expiration
  if (isNaN(expiry) || Date.now() > expiry) return false;

  // Verify signature
  const expectedSignature = await createSignature(`${sessionId}.${expiry}`);

  // Constant-time comparison
  if (signature.length !== expectedSignature.length) return false;

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate a session token (for use in API routes with Node.js crypto)
 */
export async function generateSessionToken(): Promise<string> {
  const sessionId = generateRandomHex(32);
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const signature = await createSignature(`${sessionId}.${expiry}`);
  return `${sessionId}.${expiry}.${signature}`;
}

/**
 * Generate random hex string using Web Crypto API
 */
function generateRandomHex(bytes: number): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
