/**
 * Sanitization Utility Tests
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeInput,
  sanitizeSearchQuery,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNumber,
  sanitizeFilename,
  validateFile,
} from '../sanitize.util'

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const input = '<script>alert("xss")</script><p>Safe</p>'
    expect(sanitizeHtml(input)).toBe('<p>Safe</p>')
  })

  it('should allow safe tags', () => {
    const input = '<p><strong>Bold</strong> and <em>italic</em></p>'
    expect(sanitizeHtml(input)).toBe('<p><strong>Bold</strong> and <em>italic</em></p>')
  })

  it('should remove onclick handlers', () => {
    const input = '<button onclick="alert(1)">Click</button>'
    expect(sanitizeHtml(input)).not.toContain('onclick')
  })

  it('should allow safe link attributes', () => {
    const input = '<a href="https://example.com" target="_blank">Link</a>'
    const result = sanitizeHtml(input)
    expect(result).toContain('href="https://example.com"')
  })
})

describe('sanitizeText', () => {
  it('should remove all HTML tags', () => {
    const input = '<script>alert(1)</script><p>Hello <b>World</b></p>'
    expect(sanitizeText(input)).toBe('Hello World')
  })

  it('should handle plain text', () => {
    const input = 'Just plain text'
    expect(sanitizeText(input)).toBe('Just plain text')
  })
})

describe('sanitizeInput', () => {
  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('should normalize multiple spaces', () => {
    expect(sanitizeInput('hello   world')).toBe('hello world')
  })

  it('should handle null and undefined', () => {
    expect(sanitizeInput(null)).toBe('')
    expect(sanitizeInput(undefined)).toBe('')
  })

  it('should remove HTML tags', () => {
    expect(sanitizeInput('<script>bad</script>text')).toBe('text')
  })
})

describe('sanitizeSearchQuery', () => {
  it('should remove dangerous characters', () => {
    const input = "search'; DROP TABLE users;--"
    const result = sanitizeSearchQuery(input)
    expect(result).not.toContain(';')
    expect(result).not.toContain("'")
  })

  it('should limit length to 200 characters', () => {
    const longInput = 'a'.repeat(300)
    expect(sanitizeSearchQuery(longInput).length).toBeLessThanOrEqual(200)
  })

  it('should handle empty input', () => {
    expect(sanitizeSearchQuery('')).toBe('')
  })
})

describe('sanitizeUrl', () => {
  it('should allow valid https URLs', () => {
    expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path')
  })

  it('should allow valid http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/')
  })

  it('should block javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
  })

  it('should block data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
  })

  it('should handle invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBe('')
  })

  it('should handle empty input', () => {
    expect(sanitizeUrl('')).toBe('')
  })
})

describe('sanitizeEmail', () => {
  it('should return valid email', () => {
    expect(sanitizeEmail('Test@Example.com')).toBe('test@example.com')
  })

  it('should return empty for invalid email', () => {
    expect(sanitizeEmail('not-an-email')).toBe('')
  })

  it('should handle empty input', () => {
    expect(sanitizeEmail('')).toBe('')
  })
})

describe('sanitizePhone', () => {
  it('should keep only digits and plus sign', () => {
    expect(sanitizePhone('+998 (90) 123-45-67')).toBe('+998901234567')
  })

  it('should limit length to 20 characters', () => {
    const longPhone = '+' + '9'.repeat(30)
    expect(sanitizePhone(longPhone).length).toBeLessThanOrEqual(20)
  })

  it('should handle empty input', () => {
    expect(sanitizePhone('')).toBe('')
  })
})

describe('sanitizeNumber', () => {
  it('should parse valid numbers', () => {
    expect(sanitizeNumber('123.45')).toBe(123.45)
    expect(sanitizeNumber(100)).toBe(100)
  })

  it('should return null for invalid input', () => {
    expect(sanitizeNumber('abc')).toBeNull()
    expect(sanitizeNumber('')).toBeNull()
    expect(sanitizeNumber(null)).toBeNull()
  })

  it('should respect min/max options', () => {
    expect(sanitizeNumber('5', { min: 10 })).toBe(10)
    expect(sanitizeNumber('100', { max: 50 })).toBe(50)
  })

  it('should respect decimals option', () => {
    expect(sanitizeNumber('3.14159', { decimals: 2 })).toBe(3.14)
  })
})

describe('sanitizeFilename', () => {
  it('should remove path traversal characters', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd')
  })

  it('should remove dangerous characters', () => {
    expect(sanitizeFilename('file<>:"/\\|?*.txt')).toBe('file.txt')
  })

  it('should limit length to 255 characters', () => {
    const longFilename = 'a'.repeat(300) + '.txt'
    expect(sanitizeFilename(longFilename).length).toBeLessThanOrEqual(255)
  })
})

describe('validateFile', () => {
  it('should validate file size', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }) // 5MB

    const result = validateFile(file, { maxSize: 1024 * 1024 }) // 1MB limit
    expect(result.valid).toBe(false)
    expect(result.error).toContain('size')
  })

  it('should validate file type', () => {
    const file = new File([''], 'test.exe', { type: 'application/x-msdownload' })
    Object.defineProperty(file, 'size', { value: 1024 })

    const result = validateFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('type')
  })

  it('should accept valid files', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 1024 })

    const result = validateFile(file)
    expect(result.valid).toBe(true)
    expect(result.sanitizedName).toBe('test.jpg')
  })
})
