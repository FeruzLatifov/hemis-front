/**
 * Pagination Hook
 *
 * Centralized pagination state and logic.
 * Handles page changes, size changes, and URL sync.
 *
 * @example
 * const { page, pageSize, setPage, setPageSize, paginationProps } = usePagination()
 *
 * const { data } = useQuery({
 *   queryKey: ['items', page, pageSize],
 *   queryFn: () => fetchItems({ page, size: pageSize })
 * })
 */

import { useState, useCallback, useMemo } from 'react'
import { PAGINATION } from '@/constants'

export interface PaginationState {
  page: number
  pageSize: number
}

export interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  pageSizeOptions?: number[]
}

export interface UsePaginationReturn extends PaginationState {
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  reset: () => void
  nextPage: () => void
  prevPage: () => void
  goToFirst: () => void
  goToLast: (totalPages: number) => void
  canGoNext: (totalPages: number) => boolean
  canGoPrev: () => boolean
  offset: number
  paginationProps: {
    page: number
    pageSize: number
    pageSizeOptions: readonly number[]
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = PAGINATION.DEFAULT_PAGE,
    initialPageSize = PAGINATION.DEFAULT_PAGE_SIZE,
    pageSizeOptions = PAGINATION.PAGE_SIZE_OPTIONS,
  } = options

  const [page, setPageState] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(0, newPage))
  }, [])

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize)
    setPageState(0) // Reset to first page on size change
  }, [])

  const reset = useCallback(() => {
    setPageState(initialPage)
    setPageSizeState(initialPageSize)
  }, [initialPage, initialPageSize])

  const nextPage = useCallback(() => {
    setPageState((prev) => prev + 1)
  }, [])

  const prevPage = useCallback(() => {
    setPageState((prev) => Math.max(0, prev - 1))
  }, [])

  const goToFirst = useCallback(() => {
    setPageState(0)
  }, [])

  const goToLast = useCallback((totalPages: number) => {
    setPageState(Math.max(0, totalPages - 1))
  }, [])

  const canGoNext = useCallback((totalPages: number) => page < totalPages - 1, [page])

  const canGoPrev = useCallback(() => page > 0, [page])

  const offset = useMemo(() => page * pageSize, [page, pageSize])

  const paginationProps = useMemo(
    () => ({
      page,
      pageSize,
      pageSizeOptions,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [page, pageSize, pageSizeOptions, setPage, setPageSize],
  )

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    reset,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    canGoNext,
    canGoPrev,
    offset,
    paginationProps,
  }
}
