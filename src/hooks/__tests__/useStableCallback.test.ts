/**
 * Tests for useStableCallback and useStableValue
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStableCallback, useStableValue } from '@/hooks/useStableCallback'

describe('useStableCallback', () => {
  it('returns a stable function reference across renders', () => {
    let counter = 0
    const { result, rerender } = renderHook(() => useStableCallback(() => ++counter))

    const firstRef = result.current
    rerender()
    const secondRef = result.current

    expect(firstRef).toBe(secondRef)
  })

  it('always calls the latest callback version', () => {
    const { result, rerender } = renderHook(({ value }) => useStableCallback(() => value), {
      initialProps: { value: 'initial' },
    })

    expect(result.current()).toBe('initial')

    rerender({ value: 'updated' })

    expect(result.current()).toBe('updated')
  })

  it('passes arguments through correctly', () => {
    const { result } = renderHook(() => useStableCallback((a: number, b: number) => a + b))

    expect(result.current(2, 3)).toBe(5)
  })
})

describe('useStableValue', () => {
  it('returns a ref with the current value', () => {
    const { result } = renderHook(({ value }) => useStableValue(value), {
      initialProps: { value: 42 },
    })

    expect(result.current.current).toBe(42)
  })

  it('updates when value changes', () => {
    const { result, rerender } = renderHook(({ value }) => useStableValue(value), {
      initialProps: { value: 'hello' },
    })

    expect(result.current.current).toBe('hello')

    rerender({ value: 'world' })

    expect(result.current.current).toBe('world')
  })

  it('ref identity remains stable', () => {
    const { result, rerender } = renderHook(({ value }) => useStableValue(value), {
      initialProps: { value: 1 },
    })

    const firstRef = result.current
    rerender({ value: 2 })

    expect(result.current).toBe(firstRef)
  })
})
