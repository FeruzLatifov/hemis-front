import { sanitizeUrl } from '../url.util'

describe('sanitizeUrl', () => {
  it('allows http protocol', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/')
  })

  it('allows https protocol', () => {
    expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path')
  })

  it('preserves query parameters', () => {
    expect(sanitizeUrl('https://example.com/search?q=test')).toBe(
      'https://example.com/search?q=test',
    )
  })

  it('preserves hash fragments', () => {
    expect(sanitizeUrl('https://example.com/page#section')).toBe('https://example.com/page#section')
  })

  it('rejects javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
  })

  it('rejects data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<h1>XSS</h1>')).toBeNull()
  })

  it('rejects ftp: protocol', () => {
    expect(sanitizeUrl('ftp://files.example.com')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(sanitizeUrl(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(sanitizeUrl(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(sanitizeUrl('')).toBeNull()
  })

  it('rejects malformed URL', () => {
    expect(sanitizeUrl('not-a-url')).toBeNull()
  })

  it('rejects relative paths', () => {
    expect(sanitizeUrl('/relative/path')).toBeNull()
  })
})
