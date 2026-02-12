/**
 * Tests for useFocusTrap and useAnnounce hooks
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnnounce } from '@/hooks/useFocusTrap'

describe('useAnnounce', () => {
  beforeEach(() => {
    // Clean up any existing announcer element
    const existing = document.getElementById('sr-announcer')
    if (existing) existing.remove()
  })

  afterEach(() => {
    const existing = document.getElementById('sr-announcer')
    if (existing) existing.remove()
  })

  it('creates a live region on first call', () => {
    const { result } = renderHook(() => useAnnounce())

    act(() => {
      result.current('Hello', 'polite')
    })

    const announcer = document.getElementById('sr-announcer')
    expect(announcer).not.toBeNull()
    expect(announcer?.getAttribute('role')).toBe('status')
    expect(announcer?.getAttribute('aria-live')).toBe('polite')
    expect(announcer?.getAttribute('aria-atomic')).toBe('true')
  })

  it('reuses existing announcer element', () => {
    const { result } = renderHook(() => useAnnounce())

    act(() => {
      result.current('First', 'polite')
    })

    act(() => {
      result.current('Second', 'polite')
    })

    const announcers = document.querySelectorAll('#sr-announcer')
    expect(announcers.length).toBe(1)
  })

  it('updates politeness level', () => {
    const { result } = renderHook(() => useAnnounce())

    act(() => {
      result.current('Alert!', 'assertive')
    })

    const announcer = document.getElementById('sr-announcer')
    expect(announcer?.getAttribute('aria-live')).toBe('assertive')
  })

  it('announcer is visually hidden', () => {
    const { result } = renderHook(() => useAnnounce())

    act(() => {
      result.current('Hidden message', 'polite')
    })

    const announcer = document.getElementById('sr-announcer')
    expect(announcer?.style.position).toBe('absolute')
    expect(announcer?.style.width).toBe('1px')
    expect(announcer?.style.height).toBe('1px')
    expect(announcer?.style.overflow).toBe('hidden')
  })

  it('returns a stable function reference', () => {
    const { result, rerender } = renderHook(() => useAnnounce())

    const firstRef = result.current
    rerender()
    const secondRef = result.current

    expect(firstRef).toBe(secondRef)
  })
})
