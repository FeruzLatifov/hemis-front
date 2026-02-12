/**
 * Tests for useUnsavedChanges and useFormDirtyState hooks
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormDirtyState } from '@/hooks/useUnsavedChanges'

// Mock react-router-dom
const mockBlockerState = { state: 'unblocked' as string, proceed: vi.fn(), reset: vi.fn() }
vi.mock('react-router-dom', () => ({
  useBlocker: () => mockBlockerState,
  useBeforeUnload: vi.fn(),
}))

describe('useFormDirtyState', () => {
  it('initializes with clean state by default', () => {
    const { result } = renderHook(() => useFormDirtyState())

    expect(result.current.isDirty).toBe(false)
    expect(result.current.checkDirty()).toBe(false)
  })

  it('initializes with custom state', () => {
    const { result } = renderHook(() => useFormDirtyState(true))

    expect(result.current.isDirty).toBe(true)
    expect(result.current.checkDirty()).toBe(true)
  })

  it('setDirty marks as dirty', () => {
    const { result } = renderHook(() => useFormDirtyState())

    act(() => {
      result.current.setDirty()
    })

    expect(result.current.checkDirty()).toBe(true)
  })

  it('setClean marks as clean', () => {
    const { result } = renderHook(() => useFormDirtyState(true))

    act(() => {
      result.current.setClean()
    })

    expect(result.current.checkDirty()).toBe(false)
  })

  it('returns stable function references', () => {
    const { result, rerender } = renderHook(() => useFormDirtyState())

    const firstSetDirty = result.current.setDirty
    const firstSetClean = result.current.setClean
    const firstCheckDirty = result.current.checkDirty

    rerender()

    expect(result.current.setDirty).toBe(firstSetDirty)
    expect(result.current.setClean).toBe(firstSetClean)
    expect(result.current.checkDirty).toBe(firstCheckDirty)
  })
})
