import { describe, it, expect } from 'vitest'
import {
  SECURITY_CONFIG,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  SENSITIVE_PATTERNS,
  sanitizeForLogging,
  containsXSSPattern,
  validateFileUpload,
} from '../security'

describe('SECURITY_CONFIG', () => {
  it('has idle timeout of 30 minutes', () => {
    expect(SECURITY_CONFIG.IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000)
  })

  it('has max 5 login attempts', () => {
    expect(SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS).toBe(5)
  })

  it('has 30s API timeout', () => {
    expect(SECURITY_CONFIG.API_TIMEOUT_MS).toBe(30000)
  })
})

describe('ALLOWED_FILE_TYPES', () => {
  it('includes standard image types', () => {
    expect(ALLOWED_FILE_TYPES.images).toContain('image/jpeg')
    expect(ALLOWED_FILE_TYPES.images).toContain('image/png')
  })

  it('includes PDF in documents', () => {
    expect(ALLOWED_FILE_TYPES.documents).toContain('application/pdf')
  })
})

describe('MAX_FILE_SIZES', () => {
  it('image max is 5MB', () => {
    expect(MAX_FILE_SIZES.image).toBe(5 * 1024 * 1024)
  })

  it('document max is 10MB', () => {
    expect(MAX_FILE_SIZES.document).toBe(10 * 1024 * 1024)
  })

  it('avatar max is 2MB', () => {
    expect(MAX_FILE_SIZES.avatar).toBe(2 * 1024 * 1024)
  })
})

describe('SENSITIVE_PATTERNS', () => {
  it('matches password fields', () => {
    expect(SENSITIVE_PATTERNS.some((p) => p.test('password'))).toBe(true)
    expect(SENSITIVE_PATTERNS.some((p) => p.test('Password'))).toBe(true)
  })

  it('matches token fields', () => {
    expect(SENSITIVE_PATTERNS.some((p) => p.test('accessToken'))).toBe(true)
  })

  it('does not match safe fields', () => {
    expect(SENSITIVE_PATTERNS.some((p) => p.test('username'))).toBe(false)
  })
})

describe('sanitizeForLogging', () => {
  it('redacts sensitive fields', () => {
    const result = sanitizeForLogging({
      username: 'admin',
      password: 'secret123',
      token: 'jwt-token',
    })
    expect(result.username).toBe('admin')
    expect(result.password).toBe('[REDACTED]')
    expect(result.token).toBe('[REDACTED]')
  })

  it('keeps non-sensitive fields', () => {
    const result = sanitizeForLogging({ name: 'John', email: 'john@test.com' })
    expect(result.name).toBe('John')
    expect(result.email).toBe('john@test.com')
  })
})

describe('containsXSSPattern', () => {
  it('detects script tags', () => {
    expect(containsXSSPattern('<script>alert(1)</script>')).toBe(true)
  })

  it('detects javascript: protocol', () => {
    expect(containsXSSPattern('javascript:alert(1)')).toBe(true)
  })

  it('detects event handlers', () => {
    expect(containsXSSPattern('onclick=alert(1)')).toBe(true)
    expect(containsXSSPattern('onload = doEvil()')).toBe(true)
  })

  it('detects iframe tags', () => {
    expect(containsXSSPattern('<iframe src="evil">')).toBe(true)
  })

  it('detects data: protocol', () => {
    expect(containsXSSPattern('data:text/html,<h1>XSS</h1>')).toBe(true)
  })

  it('detects expression()', () => {
    expect(containsXSSPattern('expression(alert(1))')).toBe(true)
  })

  it('returns false for safe strings', () => {
    expect(containsXSSPattern('Hello World')).toBe(false)
    expect(containsXSSPattern('document.pdf')).toBe(false)
  })
})

describe('validateFileUpload', () => {
  function createFile(name: string, type: string, size: number): File {
    const blob = new Blob(['x'.repeat(size)], { type })
    return new File([blob], name, { type })
  }

  it('accepts valid image file', () => {
    const file = createFile('photo.jpg', 'image/jpeg', 1024)
    const result = validateFileUpload(file, [...ALLOWED_FILE_TYPES.images], MAX_FILE_SIZES.image)
    expect(result.valid).toBe(true)
  })

  it('rejects disallowed file type', () => {
    const file = createFile('malware.exe', 'application/x-msdownload', 1024)
    const result = validateFileUpload(file, [...ALLOWED_FILE_TYPES.images], MAX_FILE_SIZES.image)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('ruxsat')
  })

  it('rejects file exceeding max size', () => {
    const file = createFile('big.jpg', 'image/jpeg', 10 * 1024 * 1024)
    const result = validateFileUpload(file, [...ALLOWED_FILE_TYPES.images], MAX_FILE_SIZES.image)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('5MB')
  })

  it('rejects file with XSS in name', () => {
    const file = createFile('<script>alert(1)</script>.jpg', 'image/jpeg', 1024)
    const result = validateFileUpload(file, [...ALLOWED_FILE_TYPES.images], MAX_FILE_SIZES.image)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('xavfli')
  })
})
