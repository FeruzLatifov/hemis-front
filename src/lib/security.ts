/**
 * Security Configuration & Constants
 *
 * Central place for all security-related configuration
 * IMPORTANT: Keep this file updated when adding new security measures
 */

// ✅ Session timeouts (in milliseconds)
export const SECURITY_CONFIG = {
  // Idle timeout - logout after 30 minutes of inactivity
  IDLE_TIMEOUT_MS: 30 * 60 * 1000,

  // Token refresh interval - refresh 1 minute before expiration
  TOKEN_REFRESH_BUFFER_MS: 60 * 1000,

  // Maximum login attempts before temporary lockout
  MAX_LOGIN_ATTEMPTS: 5,

  // Lockout duration after max attempts (in milliseconds)
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,

  // API request timeout
  API_TIMEOUT_MS: 30000,

  // Rate limit retry-after default (seconds)
  DEFAULT_RATE_LIMIT_WAIT: 60,
} as const

// ✅ Allowed file types for uploads
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const

// ✅ Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  avatar: 2 * 1024 * 1024, // 2MB
} as const

// ✅ Sensitive data patterns (for logging sanitization)
export const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /api[_-]?key/i,
  /credit[_-]?card/i,
  /ssn/i,
  /passport/i,
] as const

/**
 * Sanitize object for logging - removes sensitive fields
 */
export function sanitizeForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))
    sanitized[key] = isSensitive ? '[REDACTED]' : value
  }

  return sanitized
}

/**
 * Check if a string contains potential XSS patterns
 */
export function containsXSSPattern(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /expression\s*\(/i,
  ]

  return xssPatterns.some((pattern) => pattern.test(input))
}

/**
 * Validate file for upload security
 */
export function validateFileUpload(
  file: File,
  allowedTypes: readonly string[],
  maxSize: number,
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Fayl turi ruxsat etilmagan' }
  }

  // Check file size
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024)
    return { valid: false, error: `Fayl hajmi ${maxMB}MB dan oshmasligi kerak` }
  }

  // Check file name for suspicious patterns
  if (containsXSSPattern(file.name)) {
    return { valid: false, error: "Fayl nomi xavfli belgilar o'z ichiga olgan" }
  }

  return { valid: true }
}
