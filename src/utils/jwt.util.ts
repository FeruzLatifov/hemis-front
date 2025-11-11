/**
 * JWT Token Utilities
 *
 * Helper functions for parsing and validating JWT tokens
 */

interface JWTPayload {
  sub: string;
  username?: string;
  email?: string;
  full_name?: string;
  scope?: string;
  authorities?: string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Parse JWT token and extract payload
 */
export const parseJWT = (token: string | null): JWTPayload | null => {
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param token JWT token
 * @param bufferSeconds Extra time buffer in seconds (default: 60s)
 */
export const isTokenExpired = (token: string | null, bufferSeconds: number = 60): boolean => {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now + bufferSeconds;
};

/**
 * Get token expiration time in milliseconds
 */
export const getTokenExpiration = (token: string | null): number | null => {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return null;

  return payload.exp * 1000; // Convert to milliseconds
};

/**
 * Get authorities/permissions from token
 */
export const getTokenAuthorities = (token: string | null): string[] => {
  const payload = parseJWT(token);
  if (!payload) return [];

  // Check both 'scope' and 'authorities' fields
  if (payload.scope) {
    return payload.scope.split(' ');
  }

  if (payload.authorities && Array.isArray(payload.authorities)) {
    return payload.authorities;
  }

  return [];
};
