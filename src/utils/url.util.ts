/**
 * URL Sanitization Utility
 *
 * Validates and sanitizes URLs to prevent XSS and open redirect attacks
 * SECURITY: Critical for preventing javascript: and data: URL attacks
 */

import { addBreadcrumb } from '@/lib/sentry'

const ALLOWED_PROTOCOLS = ['http:', 'https:']

// ✅ SECURITY: Blocked dangerous patterns
const DANGEROUS_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /file:/i,
  /blob:/i,
  /<script/i,
  /on\w+=/i, // onclick=, onerror=, etc.
]

// Record a blocked-URL event in Sentry without flooding the main error stream.
// Breadcrumbs surface in the next captured exception, giving us forensic context
// for genuine attacks while staying silent on benign noise.
function reportBlockedUrl(reason: string, value: string): void {
  addBreadcrumb({
    category: 'security',
    message: `[SECURITY] ${reason}`,
    level: 'warning',
    data: { value: value.substring(0, 50) },
  })
}

/**
 * Sanitize a URL - returns null if the URL is invalid or potentially dangerous
 * Prevents XSS via javascript: URLs and open redirect attacks
 */
export function sanitizeUrl(url: string | undefined | null): string | null {
  if (!url) return null

  // ✅ SECURITY: Trim and check for dangerous patterns first
  const trimmed = url.trim()

  // Check for dangerous patterns before parsing
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      reportBlockedUrl('Blocked dangerous URL pattern', trimmed)
      return null
    }
  }

  try {
    const parsed = new URL(trimmed)

    // ✅ SECURITY: Only allow http/https protocols
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      reportBlockedUrl(`Blocked non-http(s) protocol: ${parsed.protocol}`, trimmed)
      return null
    }

    // ✅ SECURITY: Check for encoded dangerous characters in path
    const decodedPath = decodeURIComponent(parsed.pathname + parsed.search)
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(decodedPath)) {
        reportBlockedUrl('Blocked dangerous encoded URL', trimmed)
        return null
      }
    }

    return parsed.href
  } catch {
    // If URL is relative or malformed, reject it
    return null
  }
}

/**
 * Check if a URL is from a trusted domain
 * Use for external link validation
 */
export function isTrustedDomain(url: string | undefined | null): boolean {
  if (!url) return false

  const sanitized = sanitizeUrl(url)
  if (!sanitized) return false

  try {
    const parsed = new URL(sanitized)
    const trustedDomains = ['hemis.uz', 'edu.uz', 'gov.uz']

    return trustedDomains.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
    )
  } catch {
    return false
  }
}
