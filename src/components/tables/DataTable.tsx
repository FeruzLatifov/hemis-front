import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  /** Stable id; also the server sort field when `sortable`. */
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortable?: boolean
  /** Tailwind width utility, e.g. "w-24". */
  widthClassName?: string
  /** Extra classes for the <td> (e.g. text alignment). */
  cellClassName?: string
}

export type SortDir = 'asc' | 'desc'

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  isLoading?: boolean
  skeletonRows?: number
  /** Empty-state content (filter-aware message, clear-filters action, etc.). */
  emptyState?: ReactNode
  onRowClick?: (row: T) => void
  /** Server-side sort: current field + direction, and the toggle handler. */
  sortBy?: string
  sortDir?: SortDir
  onSortChange?: (field: string, dir: SortDir) => void
}

/**
 * Column-def-driven table shell. Replaces the hand-rolled <table> blocks that
 * copy-paste their own thead/skeleton/empty markup on ~30 list pages. Handles
 * skeleton, empty, alternating rows, and server-side sortable headers; the page
 * still owns filters, pagination, and data fetching.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  skeletonRows = 8,
  emptyState,
  onRowClick,
  sortBy,
  sortDir,
  onSortChange,
}: DataTableProps<T>) {
  const { t } = useTranslation()

  const toggleSort = (field: string) => {
    if (!onSortChange) return
    const nextDir: SortDir = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc'
    onSortChange(field, nextDir)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-[var(--border-color-pro)]">
            {columns.map((col) => {
              const isSorted = sortBy === col.id
              return (
                <th
                  key={col.id}
                  className={cn(
                    'bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]',
                    col.widthClassName,
                  )}
                  aria-sort={
                    isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.id)}
                      className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
                    >
                      {col.header}
                      {isSorted ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`skeleton-${i}`} className={i % 2 === 1 ? 'bg-[var(--table-row-alt)]' : ''}>
                {columns.map((col) => (
                  <td key={col.id} className="px-3 py-2">
                    <Skeleton className="h-4 w-full rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-16 text-center">
                {emptyState ?? (
                  <p className="text-sm text-[var(--text-secondary)]">{t('No data found')}</p>
                )}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-[var(--border-color-pro)] transition-colors hover:bg-[var(--hover-bg)]',
                  idx % 2 === 1 ? 'bg-[var(--table-row-alt)]' : 'bg-[var(--card-bg)]',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(
                      'px-3 py-2 text-sm text-[var(--text-primary)]',
                      col.cellClassName,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
