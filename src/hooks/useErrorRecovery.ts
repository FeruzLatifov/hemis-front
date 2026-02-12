/**
 * Error Recovery Hooks
 *
 * Provides error recovery patterns for API calls and network issues.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Offline detection
 * - Error classification
 * - Recovery strategies
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

/**
 * Error types for classification
 */
export type ErrorType =
  | 'network' // No network connection
  | 'timeout' // Request timeout
  | 'server' // 5xx errors
  | 'auth' // 401/403 errors
  | 'validation' // 400/422 errors
  | 'notFound' // 404 errors
  | 'rateLimit' // 429 errors
  | 'unknown' // Unclassified errors

/**
 * Classify an error by type
 */
export function classifyError(error: unknown): ErrorType {
  if (!error) return 'unknown'

  // Check for network errors (TypeError from fetch)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'network'
  }

  // Check for AbortError (timeout)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'timeout'
  }

  // Check for Axios/fetch response errors
  const { status, hasResponse } = getErrorStatus(error)

  // Only treat as network error if we have a response structure but status is 0
  if (status === 0 && hasResponse) return 'network'
  if (status === 401 || status === 403) return 'auth'
  if (status === 404) return 'notFound'
  if (status === 422 || status === 400) return 'validation'
  if (status === 429) return 'rateLimit'
  if (status >= 500) return 'server'

  return 'unknown'
}

/**
 * Get HTTP status from error object
 */
function getErrorStatus(error: unknown): { status: number; hasResponse: boolean } {
  if (!error || typeof error !== 'object') return { status: 0, hasResponse: false }

  // Axios error
  if ('response' in error) {
    const axiosError = error as { response?: { status?: number } }
    return {
      status: axiosError.response?.status ?? 0,
      hasResponse: true,
    }
  }

  // Standard error with status
  if ('status' in error) {
    return {
      status: (error as { status: number }).status,
      hasResponse: true,
    }
  }

  return { status: 0, hasResponse: false }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const type = classifyError(error)
  return type === 'network' || type === 'timeout' || type === 'server'
}

/**
 * Online/Offline Detection Hook
 *
 * @example
 * const { isOnline, wasOffline } = useOnlineStatus()
 *
 * if (!isOnline) {
 *   return <OfflineBanner />
 * }
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        // Connection restored
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return { isOnline, wasOffline }
}

/**
 * Auto-retry Hook
 *
 * Automatically retries a function with exponential backoff.
 *
 * @example
 * const { execute, isRetrying, retryCount, cancel } = useRetry({
 *   fn: fetchData,
 *   maxRetries: 3,
 *   onSuccess: (data) => setData(data),
 *   onError: (err) => setError(err),
 * })
 */
export interface UseRetryOptions<T> {
  /** The async function to retry */
  fn: () => Promise<T>
  /** Maximum number of retries (default: 3) */
  maxRetries?: number
  /** Initial delay in ms (default: 1000) */
  initialDelay?: number
  /** Maximum delay in ms (default: 30000) */
  maxDelay?: number
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number
  /** Whether to retry on this error (default: isRetryableError) */
  shouldRetry?: (error: unknown) => boolean
  /** Called on successful completion */
  onSuccess?: (result: T) => void
  /** Called on final failure (after all retries exhausted) */
  onError?: (error: unknown) => void
  /** Called on each retry attempt */
  onRetry?: (retryCount: number, error: unknown) => void
}

export interface UseRetryReturn<T> {
  /** Execute the function (starts retry cycle) */
  execute: () => Promise<T | undefined>
  /** Whether currently retrying */
  isRetrying: boolean
  /** Current retry count */
  retryCount: number
  /** Cancel any pending retry */
  cancel: () => void
  /** Whether the operation is in progress */
  isLoading: boolean
  /** Last error that occurred */
  error: unknown
}

export function useRetry<T>({
  fn,
  maxRetries = 3,
  initialDelay = 1000,
  maxDelay = 30000,
  backoffMultiplier = 2,
  shouldRetry = isRetryableError,
  onSuccess,
  onError,
  onRetry,
}: UseRetryOptions<T>): UseRetryReturn<T> {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<unknown>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  const cancel = useCallback(() => {
    cancelledRef.current = true
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsRetrying(false)
    setIsLoading(false)
  }, [])

  const execute = useCallback(async (): Promise<T | undefined> => {
    cancelledRef.current = false
    setIsLoading(true)
    setError(null)
    setRetryCount(0)

    let currentRetry = 0
    let delay = initialDelay

    while (currentRetry <= maxRetries && !cancelledRef.current) {
      try {
        const result = await fn()
        if (!cancelledRef.current) {
          setIsLoading(false)
          setIsRetrying(false)
          onSuccess?.(result)
          return result
        }
        return undefined
      } catch (err) {
        if (cancelledRef.current) return undefined

        setError(err)

        // Check if we should retry
        if (currentRetry < maxRetries && shouldRetry(err)) {
          currentRetry++
          setRetryCount(currentRetry)
          setIsRetrying(true)
          onRetry?.(currentRetry, err)

          // Wait before retrying
          await new Promise<void>((resolve) => {
            timeoutRef.current = setTimeout(resolve, delay)
          })

          // Exponential backoff
          delay = Math.min(delay * backoffMultiplier, maxDelay)
        } else {
          // No more retries
          setIsLoading(false)
          setIsRetrying(false)
          onError?.(err)
          throw err
        }
      }
    }

    return undefined
  }, [
    fn,
    maxRetries,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    shouldRetry,
    onSuccess,
    onError,
    onRetry,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    execute,
    isRetrying,
    retryCount,
    cancel,
    isLoading,
    error,
  }
}

/**
 * Offline Notification Hook
 *
 * Shows a toast notification when the user goes offline/online.
 */
export function useOfflineNotification() {
  const { t } = useTranslation()
  const { isOnline, wasOffline } = useOnlineStatus()

  useEffect(() => {
    if (!isOnline) {
      toast.error(t('No internet connection'), {
        id: 'offline-notification',
        duration: Infinity,
        description: t('Please check your network connection'),
      })
    } else if (wasOffline) {
      toast.dismiss('offline-notification')
      toast.success(t('Connection restored'), {
        description: t('Your internet connection is back'),
      })
    }
  }, [isOnline, wasOffline, t])

  return { isOnline }
}
