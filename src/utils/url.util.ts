/**
 * URL Sanitization Utility
 *
 * Validates and sanitizes URLs to prevent XSS and open redirect attacks
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:']

/**
 * Sanitize a URL - returns null if the URL is invalid or potentially dangerous
 */
export function sanitizeUrl(url: string | undefined | null): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return parsed.href
    }
    return null
  } catch {
    // If URL is relative or malformed, reject it
    return null
  }
}
