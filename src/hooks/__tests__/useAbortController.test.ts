/**
 * Tests for useAbortController, useMountedState, isAbortError
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAbortController, useMountedState, isAbortError } from '@/hooks/useAbortController'

describe('useAbortController', () => {
  it('returns a valid signal', () => {
    const { result } = renderHook(() => useAbortController())

    expect(result.current.signal).toBeInstanceOf(AbortSignal)
    expect(result.current.signal.aborted).toBe(false)
  })

  it('aborts the controller when abort is called', () => {
    const { result } = renderHook(() => useAbortController())

    act(() => {
      result.current.abort()
    })

    expect(result.current.isAborted()).toBe(true)
  })

  it('resets to a new controller', () => {
    const { result } = renderHook(() => useAbortController())

    // Abort the current controller
    act(() => {
      result.current.abort()
    })
    expect(result.current.isAborted()).toBe(true)

    // Reset creates a new controller
    let newSignal: AbortSignal
    act(() => {
      newSignal = result.current.reset()
    })

    expect(newSignal!).toBeInstanceOf(AbortSignal)
    expect(newSignal!.aborted).toBe(false)
    expect(result.current.isAborted()).toBe(false)
  })

  it('aborts on unmount', () => {
    const { result, unmount } = renderHook(() => useAbortController())

    const signal = result.current.signal
    expect(signal.aborted).toBe(false)

    unmount()

    expect(signal.aborted).toBe(true)
  })

  it('isAborted returns false initially', () => {
    const { result } = renderHook(() => useAbortController())
    expect(result.current.isAborted()).toBe(false)
  })
})

describe('useMountedState', () => {
  it('returns true when mounted', () => {
    const { result } = renderHook(() => useMountedState())
    expect(result.current.isMounted()).toBe(true)
  })

  it('returns false after unmount', () => {
    const { result, unmount } = renderHook(() => useMountedState())

    expect(result.current.isMounted()).toBe(true)

    unmount()

    expect(result.current.isMounted()).toBe(false)
  })
})

describe('isAbortError', () => {
  it('returns true for AbortError', () => {
    const error = new Error('The operation was aborted')
    error.name = 'AbortError'
    expect(isAbortError(error)).toBe(true)
  })

  it('returns true for CanceledError (axios)', () => {
    const error = new Error('Request canceled')
    error.name = 'CanceledError'
    expect(isAbortError(error)).toBe(true)
  })

  it('returns false for regular errors', () => {
    expect(isAbortError(new Error('Network error'))).toBe(false)
  })

  it('returns false for non-error values', () => {
    expect(isAbortError(null)).toBe(false)
    expect(isAbortError(undefined)).toBe(false)
    expect(isAbortError('string')).toBe(false)
    expect(isAbortError(42)).toBe(false)
  })
})
