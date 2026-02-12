/**
 * Error Recovery Hooks Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { classifyError, isRetryableError, useOnlineStatus, useRetry } from '../useErrorRecovery'

describe('classifyError', () => {
  it('should classify network errors', () => {
    const networkError = new TypeError('Failed to fetch')
    expect(classifyError(networkError)).toBe('network')
  })

  it('should classify timeout errors', () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    expect(classifyError(abortError)).toBe('timeout')
  })

  it('should classify auth errors', () => {
    const error = { response: { status: 401 } }
    expect(classifyError(error)).toBe('auth')

    const forbiddenError = { response: { status: 403 } }
    expect(classifyError(forbiddenError)).toBe('auth')
  })

  it('should classify server errors', () => {
    const serverError = { response: { status: 500 } }
    expect(classifyError(serverError)).toBe('server')

    const badGateway = { response: { status: 502 } }
    expect(classifyError(badGateway)).toBe('server')
  })

  it('should classify not found errors', () => {
    const notFound = { response: { status: 404 } }
    expect(classifyError(notFound)).toBe('notFound')
  })

  it('should classify validation errors', () => {
    const badRequest = { response: { status: 400 } }
    expect(classifyError(badRequest)).toBe('validation')

    const unprocessable = { response: { status: 422 } }
    expect(classifyError(unprocessable)).toBe('validation')
  })

  it('should classify rate limit errors', () => {
    const rateLimited = { response: { status: 429 } }
    expect(classifyError(rateLimited)).toBe('rateLimit')
  })

  it('should return unknown for unclassified errors', () => {
    expect(classifyError(null)).toBe('unknown')
    expect(classifyError({})).toBe('unknown')
    expect(classifyError('string error')).toBe('unknown')
  })
})

describe('isRetryableError', () => {
  it('should return true for network errors', () => {
    const networkError = new TypeError('Failed to fetch')
    expect(isRetryableError(networkError)).toBe(true)
  })

  it('should return true for server errors', () => {
    const serverError = { response: { status: 500 } }
    expect(isRetryableError(serverError)).toBe(true)
  })

  it('should return true for timeout errors', () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    expect(isRetryableError(abortError)).toBe(true)
  })

  it('should return false for auth errors', () => {
    const authError = { response: { status: 401 } }
    expect(isRetryableError(authError)).toBe(false)
  })

  it('should return false for validation errors', () => {
    const validationError = { response: { status: 400 } }
    expect(isRetryableError(validationError)).toBe(false)
  })
})

describe('useOnlineStatus', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  it('should return online status', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current.isOnline).toBe(true)
    expect(result.current.wasOffline).toBe(false)
  })

  it('should update when going offline', async () => {
    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      window.dispatchEvent(new Event('offline'))
    })

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false)
      expect(result.current.wasOffline).toBe(true)
    })
  })

  it('should update when coming back online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false })

    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true })
      window.dispatchEvent(new Event('online'))
    })

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
    })
  })
})

describe('useRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should execute function and return result on success', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    const onSuccess = vi.fn()

    const { result } = renderHook(() =>
      useRetry({
        fn: mockFn,
        onSuccess,
      }),
    )

    let executeResult: string | undefined
    await act(async () => {
      executeResult = await result.current.execute()
    })

    expect(executeResult).toBe('success')
    expect(onSuccess).toHaveBeenCalledWith('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable error', async () => {
    const error = { response: { status: 500 } }
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success')

    const onRetry = vi.fn()

    const { result } = renderHook(() =>
      useRetry({
        fn: mockFn,
        onRetry,
        initialDelay: 100,
        maxRetries: 3,
      }),
    )

    const executePromise = result.current.execute()

    // Fast forward through delays
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100) // First retry
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200) // Second retry (exponential backoff)
    })

    const executeResult = await executePromise

    expect(executeResult).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
    expect(onRetry).toHaveBeenCalledTimes(2)
  })

  it('should not retry on non-retryable error', async () => {
    const authError = { response: { status: 401 } }
    const mockFn = vi.fn().mockRejectedValue(authError)
    const onError = vi.fn()

    const { result } = renderHook(() =>
      useRetry({
        fn: mockFn,
        onError,
        maxRetries: 3,
      }),
    )

    await act(async () => {
      try {
        await result.current.execute()
      } catch {
        // Expected to throw
      }
    })

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalled()
  })

  it('should be cancellable', async () => {
    const mockFn = vi.fn().mockRejectedValue({ response: { status: 500 } })

    const { result } = renderHook(() =>
      useRetry({
        fn: mockFn,
        maxRetries: 5,
        initialDelay: 1000,
      }),
    )

    act(() => {
      result.current.execute()
    })

    act(() => {
      result.current.cancel()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isRetrying).toBe(false)
  })
})
