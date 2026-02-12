/**
 * AbortController Hook
 *
 * Provides automatic request cancellation when component unmounts.
 * Prevents "Can't perform a React state update on unmounted component" warnings.
 *
 * @example
 * function MyComponent() {
 *   const { signal, abort, isAborted } = useAbortController()
 *
 *   useEffect(() => {
 *     fetchData(signal).then(setData).catch(err => {
 *       if (!isAborted()) {
 *         setError(err)
 *       }
 *     })
 *   }, [signal, isAborted])
 *
 *   return <div>...</div>
 * }
 */

import { useRef, useEffect, useCallback } from 'react'

export interface UseAbortControllerReturn {
  /** AbortSignal to pass to fetch/axios requests */
  signal: AbortSignal
  /** Manually abort the current request */
  abort: () => void
  /** Check if the controller has been aborted */
  isAborted: () => boolean
  /** Create a new controller (useful for retries) */
  reset: () => AbortSignal
}

export function useAbortController(): UseAbortControllerReturn {
  const controllerRef = useRef<AbortController>(new AbortController())

  // Abort on unmount
  useEffect(() => {
    return () => {
      controllerRef.current.abort()
    }
  }, [])

  const abort = useCallback(() => {
    controllerRef.current.abort()
  }, [])

  const isAborted = useCallback(() => {
    return controllerRef.current.signal.aborted
  }, [])

  const reset = useCallback(() => {
    controllerRef.current = new AbortController()
    return controllerRef.current.signal
  }, [])

  return {
    signal: controllerRef.current.signal,
    abort,
    isAborted,
    reset,
  }
}

/**
 * Check if an error is an abort error
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')
}

/**
 * Safe state setter that checks if component is still mounted
 *
 * @example
 * const [data, setData] = useState(null)
 * const { isMounted } = useMountedState()
 *
 * useEffect(() => {
 *   fetchData().then(result => {
 *     if (isMounted()) setData(result)
 *   })
 * }, [isMounted])
 */
export function useMountedState(): {
  isMounted: () => boolean
} {
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const isMounted = useCallback(() => mountedRef.current, [])

  return { isMounted }
}
