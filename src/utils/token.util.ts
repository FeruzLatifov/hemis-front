/**
 * Token Utility Functions
 *
 * Client-side JWT token validation and expiry checks
 * Following best practices - no server calls needed
 */

interface JWTPayload {
  sub: string;        // User ID
  iat: number;        // Issued at (timestamp)
  exp: number;        // Expiry (timestamp)
  type?: string;      // Token type (access/refresh)
  [key: string]: unknown; // Other claims
}

/**
 * Decode JWT token (client-side)
 *
 * NOTE: This does NOT validate signature - only decodes payload
 * Signature validation happens on server when token is used
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64url payload
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired (client-side)
 *
 * Best Practice: Check expiry locally, no server call needed
 *
 * @param token - JWT token
 * @param bufferSeconds - Refresh before actual expiry (default: 60s)
 * @returns true if expired or will expire within buffer time
 */
export function isTokenExpired(token: string | null, bufferSeconds: number = 60): boolean {
  if (!token) {
    return true;
  }

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // Current time in seconds
  const now = Math.floor(Date.now() / 1000);

  // Check if expired (with buffer for proactive refresh)
  return payload.exp <= now + bufferSeconds;
}

/**
 * Check if token is valid (format + not expired)
 *
 * Client-side validation - no server call
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) {
    return false;
  }

  // Check format
  const payload = decodeJWT(token);
  if (!payload) {
    return false;
  }

  // Check expiry
  return !isTokenExpired(token);
}

/**
 * Get token expiry time
 */
export function getTokenExpiry(token: string | null): Date | null {
  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenTimeToExpiry(token: string | null): number {
  if (!token) {
    return 0;
  }

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = payload.exp - now;

  return Math.max(0, ttl);
}

/**
 * Extract user ID from token (client-side)
 */
export function getUserIdFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);
  return payload?.sub || null;
}
