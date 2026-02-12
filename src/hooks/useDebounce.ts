/**
 * Debounce Hook
 *
 * Delays updating a value until after a specified delay has passed.
 * Useful for search inputs, API calls, and expensive operations.
 *
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 *
 * useEffect(() => {
 *   // This only runs after user stops typing for 300ms
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounced callback hook
 *
 * Returns a debounced version of the callback.
 * Useful when you need to debounce a function rather than a value.
 *
 * @example
 * const debouncedSave = useDebouncedCallback((data) => {
 *   saveToServer(data)
 * }, 500)
 */
import { useCallback, useRef } from 'react'

export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number = 300,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay],
  ) as T

  return debouncedCallback
}
