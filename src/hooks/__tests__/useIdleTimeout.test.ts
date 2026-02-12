/**
 * Tests for useIdleTimeout hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIdleTimeout } from '@/hooks/useIdleTimeout'

// Mock security config
vi.mock('@/lib/security', () => ({
  SECURITY_CONFIG: {
    IDLE_TIMEOUT_MS: 1800000, // 30 minutes
  },
}))

describe('useIdleTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls onIdle after timeout', () => {
    const onIdle = vi.fn()

    renderHook(() => useIdleTimeout({ timeout: 5000, onIdle }))

    expect(onIdle).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('resets timer on user activity', () => {
    const onIdle = vi.fn()

    renderHook(() => useIdleTimeout({ timeout: 5000, onIdle }))

    // Advance partway
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onIdle).not.toHaveBeenCalled()

    // Simulate user activity (more than 1s after last event for throttle)
    act(() => {
      vi.advanceTimersByTime(1100)
      document.dispatchEvent(new Event('mousedown'))
    })

    // Timer should reset - advance another 4s (total not yet 5s from last activity)
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(onIdle).not.toHaveBeenCalled()

    // Now complete the full 5s from last activity
    act(() => {
      vi.advanceTimersByTime(1100)
    })
    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('does not fire when enabled is false', () => {
    const onIdle = vi.fn()

    renderHook(() => useIdleTimeout({ timeout: 5000, onIdle, enabled: false }))

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(onIdle).not.toHaveBeenCalled()
  })

  it('clears timer on unmount', () => {
    const onIdle = vi.fn()

    const { unmount } = renderHook(() => useIdleTimeout({ timeout: 5000, onIdle }))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(onIdle).not.toHaveBeenCalled()
  })

  it('returns resetTimer function', () => {
    const onIdle = vi.fn()

    const { result } = renderHook(() => useIdleTimeout({ timeout: 5000, onIdle }))

    expect(typeof result.current.resetTimer).toBe('function')
  })

  it('returns lastActivity timestamp', () => {
    const onIdle = vi.fn()

    const { result } = renderHook(() => useIdleTimeout({ timeout: 5000, onIdle }))

    expect(typeof result.current.lastActivity).toBe('number')
    expect(result.current.lastActivity).toBeGreaterThan(0)
  })
})
