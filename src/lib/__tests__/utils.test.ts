import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

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
})
