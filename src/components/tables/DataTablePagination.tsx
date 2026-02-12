import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { PAGINATION } from '@/constants'

interface DataTablePaginationProps {
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: readonly number[]
}

function getVisiblePages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i)
  }

  const pages: (number | 'ellipsis')[] = []

  pages.push(0)

  if (current > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 3) {
    pages.push('ellipsis')
  }

  pages.push(total - 1)

  return pages
}

export function DataTablePagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGINATION.PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps) {
  const { t } = useTranslation()

  const from = totalElements === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalElements)

  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div className="flex items-center justify-between px-1 py-3">
      {/* Left: Page size + info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">{t('Per page')}:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--active-bg)] focus:outline-none"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {from}–{to} / {t('Total')}:{' '}
          <span className="font-medium text-gray-700">{totalElements}</span>
        </span>
      </div>

      {/* Right: Page buttons */}
      <div className="flex items-center gap-1">
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          onClick={() => onPageChange(0)}
          disabled={page === 0}
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {visiblePages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-sm text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                p === page
                  ? 'pointer-events-none bg-[var(--primary)] text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </button>
          ),
        )}

        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
