/**
 * Input Sanitization Utilities
 *
 * Provides XSS prevention and input sanitization for user inputs.
 * All user inputs should be sanitized before:
 * - Displaying in the UI
 * - Sending to the backend
 * - Storing in state
 */

import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @example
 * const safeHtml = sanitizeHtml('<script>alert("xss")</script><p>Safe content</p>')
 * // Returns: '<p>Safe content</p>'
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'i',
      'em',
      'strong',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitize plain text - removes all HTML tags
 *
 * @example
 * const safeText = sanitizeText('<script>alert("xss")</script>Hello')
 * // Returns: 'Hello'
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize and trim string input
 * Removes HTML, trims whitespace, and normalizes spaces
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return ''
  const sanitized = sanitizeText(input)
  return sanitized.trim().replace(/\s+/g, ' ')
}

/**
 * Sanitize search query
 * Removes special characters that could be used for injection
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return ''
  return sanitizeInput(query)
    .replace(/[<>'"`;\\]/g, '') // Remove dangerous characters
    .substring(0, 200) // Limit length
}

/**
 * Sanitize URL - validates and sanitizes URLs
 * Returns empty string if URL is invalid or potentially dangerous
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  try {
    const parsed = new URL(url)

    // Only allow http, https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }

    // Block javascript: URLs (shouldn't happen after protocol check, but extra safety)
    if (url.toLowerCase().includes('javascript:')) {
      return ''
    }

    return parsed.href
  } catch {
    // Invalid URL
    return ''
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''
  const sanitized = sanitizeInput(email).toLowerCase()
  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(sanitized) ? sanitized : ''
}

/**
 * Sanitize phone number - keeps only digits and +
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ''
  return phone.replace(/[^\d+]/g, '').substring(0, 20)
}

/**
 * Sanitize numeric input - ensures it's a valid number
 */
export function sanitizeNumber(
  input: string | number | null | undefined,
  options?: {
    min?: number
    max?: number
    decimals?: number
  },
): number | null {
  if (input === null || input === undefined || input === '') return null

  const num = typeof input === 'number' ? input : parseFloat(String(input).replace(/[^\d.-]/g, ''))

  if (isNaN(num)) return null

  let result = num

  if (options?.min !== undefined && result < options.min) {
    result = options.min
  }

  if (options?.max !== undefined && result > options.max) {
    result = options.max
  }

  if (options?.decimals !== undefined) {
    result = parseFloat(result.toFixed(options.decimals))
  }

  return result
}

/**
 * Sanitize filename - removes path traversal and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return ''
  return filename
    .replace(/[/\\?%*:|"<>]/g, '') // Remove dangerous characters
    .replace(/\.\./g, '') // Remove path traversal
    .substring(0, 255) // Limit length
}

/**
 * Validate and sanitize file upload
 */
export interface FileValidationOptions {
  maxSize?: number // bytes
  allowedTypes?: string[] // MIME types
  allowedExtensions?: string[]
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedName?: string
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {},
): FileValidationResult {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
  } = options

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
    }
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    }
  }

  // Check extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File extension ${ext} is not allowed`,
    }
  }

  return {
    valid: true,
    sanitizedName: sanitizeFilename(file.name),
  }
}

/**
 * Create a safe HTML element for displaying user content
 * Use this instead of dangerouslySetInnerHTML
 */
export function createSafeHtml(html: string): { __html: string } {
  return { __html: sanitizeHtml(html) }
}
