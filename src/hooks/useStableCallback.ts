/**
 * Stable Callback Hook
 *
 * Returns a stable reference to a callback that always calls the latest version.
 * Useful when you need a stable callback reference but the callback logic changes.
 *
 * This solves the common problem of stale closures in useCallback.
 *
 * @example
 * // Without useStableCallback - callback becomes stale
 * const handleClick = useCallback(() => {
 *   console.log(count) // Always logs initial value!
 * }, []) // Empty deps = stale closure
 *
 * // With useStableCallback - always fresh
 * const handleClick = useStableCallback(() => {
 *   console.log(count) // Always logs current value
 * })
 */

import { useCallback, useRef, useLayoutEffect } from 'react'

export function useStableCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
): T {
  const callbackRef = useRef<T>(callback)

  // Update ref synchronously after each render
  useLayoutEffect(() => {
    callbackRef.current = callback
  })

  // Return stable callback that always calls the latest version
  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args)
    }) as T,
    [],
  )
}

/**
 * Stable value hook
 *
 * Returns a stable reference that always contains the latest value.
 * Useful for accessing current state in async callbacks without stale closures.
 *
 * @example
 * const countRef = useStableValue(count)
 *
 * const handleAsyncOperation = async () => {
 *   await delay(1000)
 *   console.log(countRef.current) // Always current value
 * }
 */
export function useStableValue<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef<T>(value)

  useLayoutEffect(() => {
    ref.current = value
  })

  return ref
}
