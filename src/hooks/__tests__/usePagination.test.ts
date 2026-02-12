/**
 * Tests for usePagination hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '@/hooks/usePagination'

describe('usePagination', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => usePagination())

    expect(result.current.page).toBe(0)
    expect(result.current.pageSize).toBe(20)
    expect(result.current.offset).toBe(0)
  })

  it('initializes with custom values', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 2, initialPageSize: 50 }))

    expect(result.current.page).toBe(2)
    expect(result.current.pageSize).toBe(50)
    expect(result.current.offset).toBe(100) // 2 * 50
  })

  it('setPage updates the page', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.setPage(3)
    })

    expect(result.current.page).toBe(3)
  })

  it('setPage does not go below 0', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.setPage(-5)
    })

    expect(result.current.page).toBe(0)
  })

  it('setPageSize resets page to 0', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.setPage(5)
    })
    expect(result.current.page).toBe(5)

    act(() => {
      result.current.setPageSize(50)
    })
    expect(result.current.pageSize).toBe(50)
    expect(result.current.page).toBe(0)
  })

  it('nextPage increments page', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.nextPage()
    })
    expect(result.current.page).toBe(1)

    act(() => {
      result.current.nextPage()
    })
    expect(result.current.page).toBe(2)
  })

  it('prevPage decrements page but not below 0', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.setPage(2)
    })

    act(() => {
      result.current.prevPage()
    })
    expect(result.current.page).toBe(1)

    act(() => {
      result.current.prevPage()
    })
    expect(result.current.page).toBe(0)

    act(() => {
      result.current.prevPage()
    })
    expect(result.current.page).toBe(0)
  })

  it('goToFirst sets page to 0', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.setPage(5)
    })

    act(() => {
      result.current.goToFirst()
    })
    expect(result.current.page).toBe(0)
  })

  it('goToLast sets page to last page', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.goToLast(10)
    })
    expect(result.current.page).toBe(9)
  })

  it('goToLast handles edge case of 0 totalPages', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.goToLast(0)
    })
    expect(result.current.page).toBe(0)
  })

  it('canGoNext returns correct value', () => {
    const { result } = renderHook(() => usePagination())

    expect(result.current.canGoNext(5)).toBe(true)

    act(() => {
      result.current.setPage(4)
    })
    expect(result.current.canGoNext(5)).toBe(false)
  })

  it('canGoPrev returns correct value', () => {
    const { result } = renderHook(() => usePagination())

    expect(result.current.canGoPrev()).toBe(false)

    act(() => {
      result.current.setPage(1)
    })
    expect(result.current.canGoPrev()).toBe(true)
  })

  it('reset restores initial values', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 0, initialPageSize: 20 }))

    act(() => {
      result.current.setPage(5)
      result.current.setPageSize(50)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.page).toBe(0)
    expect(result.current.pageSize).toBe(20)
  })

  it('offset is computed correctly', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.setPage(3)
    })
    expect(result.current.offset).toBe(60) // 3 * 20

    act(() => {
      result.current.setPageSize(10)
    })
    // page resets to 0 on size change
    expect(result.current.offset).toBe(0)
  })

  it('paginationProps has correct shape', () => {
    const { result } = renderHook(() => usePagination())

    const props = result.current.paginationProps

    expect(props).toHaveProperty('page', 0)
    expect(props).toHaveProperty('pageSize', 20)
    expect(props).toHaveProperty('pageSizeOptions')
    expect(typeof props.onPageChange).toBe('function')
    expect(typeof props.onPageSizeChange).toBe('function')
  })
})
