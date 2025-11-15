import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatNumber, debounce } from '../utils'

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('merges className strings', () => {
      expect(cn('px-2', 'py-2')).toBe('px-2 py-2')
    })

    it('handles conditional classes', () => {
      const isActive = true
      expect(cn('base', isActive && 'active')).toContain('base')
      expect(cn('base', isActive && 'active')).toContain('active')
    })

    it('merges Tailwind classes correctly', () => {
      // twMerge should keep the last conflicting class
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('15.01.2024')
    })

    it('formats string date correctly', () => {
      expect(formatDate('2024-12-25')).toBe('25.12.2024')
    })
  })

  describe('formatNumber', () => {
    it('formats number with default locale', () => {
      const result = formatNumber(1234567)
      expect(result).toBeTruthy()
    })

    it('formats number with specific locale', () => {
      const result = formatNumber(1234567, 'en-US')
      expect(result).toContain('1')
    })
  })

  describe('debounce', () => {
    it('debounces function calls', async () => {
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      // Should not be called immediately
      expect(callCount).toBe(0)

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should be called only once
      expect(callCount).toBe(1)
    })
  })
})
