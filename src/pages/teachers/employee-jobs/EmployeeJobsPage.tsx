import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStableCallback } from '@/hooks/useStableCallback'
import { Download, RefreshCw, Eye, Search, Briefcase, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import {
  useEmployeeJobs,
  useEmployeeJobDictionaries,
  useExportEmployeeJobs,
} from '@/hooks/useEmployeeJobs'
import { useDebounce } from '@/hooks/useDebounce'
import { PAGINATION, UI } from '@/constants'
import { toast } from 'sonner'
import EmployeeJobDetailDrawer from './EmployeeJobDetailDrawer'

export default function EmployeeJobsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0)
  const pageSize = Math.max(
    1,
    Math.min(
      100,
      parseInt(searchParams.get('size') || String(PAGINATION.DEFAULT_PAGE_SIZE), 10) ||
        PAGINATION.DEFAULT_PAGE_SIZE,
    ),
  )
  const searchFromUrl = (searchParams.get('q') || '').slice(0, 200)
  const universityFromUrl = searchParams.get('universityCode') || 'all'
  const employeeTypeFromUrl = searchParams.get('employeeType') || 'all'
  const activeFromUrl = searchParams.get('active') || 'all'

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, UI.SEARCH_DEBOUNCE)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: dictionaries } = useEmployeeJobDictionaries()

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(updates)) {
          if (value === undefined || value === '') {
            next.delete(key)
          } else {
            next.set(key, value)
          }
        }
        return next
      })
    },
    [setSearchParams],
  )

  const syncSearchToUrl = useStableCallback(() => {
    if (debouncedSearch !== searchFromUrl) {
      updateSearchParams({ q: debouncedSearch || undefined, page: undefined })
    }
  })

  useEffect(() => {
    syncSearchToUrl()
  }, [debouncedSearch, syncSearchToUrl])

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({ page: page > 0 ? String(page) : undefined })
    },
    [updateSearchParams],
  )

  const handlePageSizeChange = useCallback(
    (size: number) => {
      updateSearchParams({
        size: size !== PAGINATION.DEFAULT_PAGE_SIZE ? String(size) : undefined,
        page: undefined,
      })
    },
    [updateSearchParams],
  )

  const handleUniversityChange = useCallback(
    (value: string) => {
      updateSearchParams({ universityCode: value !== 'all' ? value : undefined, page: undefined })
    },
    [updateSearchParams],
  )

  const handleEmployeeTypeChange = useCallback(
    (value: string) => {
      updateSearchParams({ employeeType: value !== 'all' ? value : undefined, page: undefined })
    },
    [updateSearchParams],
  )

  const handleActiveChange = useCallback(
    (value: string) => {
      updateSearchParams({ active: value !== 'all' ? value : undefined, page: undefined })
    },
    [updateSearchParams],
  )

  const { data, isLoading, isPlaceholderData, refetch } = useEmployeeJobs({
    search: debouncedSearch,
    universityCode: universityFromUrl,
    employeeType: employeeTypeFromUrl,
    active: activeFromUrl,
    page: currentPage,
  })

  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0
  const rows = data?.content ?? []

  const exportMutation = useExportEmployeeJobs()

  const handleExport = useCallback(() => {
    exportMutation.mutate({
      q: debouncedSearch || undefined,
      universityCode: universityFromUrl === 'all' ? undefined : universityFromUrl,
      employeeType: employeeTypeFromUrl === 'all' ? undefined : employeeTypeFromUrl,
      active: activeFromUrl === 'all' ? undefined : activeFromUrl === 'true',
    })
  }, [exportMutation, debouncedSearch, universityFromUrl, employeeTypeFromUrl, activeFromUrl])

  const handleRefresh = useCallback(() => {
    refetch()
    toast.success(t('Data refreshed'))
  }, [refetch, t])

  const loading = isLoading && !isPlaceholderData
  const hasFilters = !!(
    debouncedSearch ||
    universityFromUrl !== 'all' ||
    employeeTypeFromUrl !== 'all' ||
    activeFromUrl !== 'all'
  )

  return (
    <>
      <div className="space-y-3 p-4">
        <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          {t('Employee jobs')}
        </h1>
        <div className="rounded-md border border-[var(--border-color-pro)] bg-[var(--card-bg)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color-pro)] px-4 py-2.5">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder={t('Search...')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] py-1.5 pr-3 pl-9 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--active-bg)] focus:outline-none"
              />
            </div>

            <Select value={universityFromUrl} onValueChange={handleUniversityChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('University')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('University')}</SelectItem>
                {dictionaries?.universities?.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={employeeTypeFromUrl} onValueChange={handleEmployeeTypeChange}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder={t('Employee type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Employee type')}</SelectItem>
                {dictionaries?.employeeTypes?.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activeFromUrl} onValueChange={handleActiveChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t('Active')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All')}</SelectItem>
                <SelectItem value="true">{t('Active')}</SelectItem>
                <SelectItem value="false">{t('Inactive')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <span className="text-xs text-[var(--text-secondary)] tabular-nums">
              {t('Total')}:{' '}
              <span className="font-semibold text-[var(--text-primary)]">{totalElements}</span>
            </span>

            <div className="h-5 w-px bg-[var(--border-color-pro)]" />

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('Refresh')}
            </button>

            <button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-3 py-1.5 text-sm font-medium text-[var(--emerald-text)] transition-colors hover:opacity-80 disabled:opacity-50"
            >
              {exportMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t('Export')}
            </button>
          </div>

          {(isLoading || isPlaceholderData) && (
            <div className="progress-indeterminate h-0.5 w-full" />
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[var(--border-color-pro)]">
                  <th className="bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Employee')}
                  </th>
                  <th className="bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('University name')}
                  </th>
                  <th className="bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Department')}
                  </th>
                  <th className="bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Employee type')}
                  </th>
                  <th className="bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Position')}
                  </th>
                  <th className="w-32 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Job start date')}
                  </th>
                  <th className="w-28 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Status')}
                  </th>
                  <th className="w-24 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr
                      key={`skeleton-${i}`}
                      className={i % 2 === 1 ? 'bg-[var(--table-row-alt)]' : ''}
                    >
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-3 py-2">
                          <Skeleton className="h-4 w-full rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Briefcase className="h-8 w-8 text-[var(--text-secondary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {t('No data found')}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                            {hasFilters
                              ? t('Try changing your search or filters')
                              : t('No records have been added yet')}
                          </p>
                        </div>
                        {hasFilters && (
                          <button
                            onClick={() => {
                              setSearchInput('')
                              updateSearchParams({
                                q: undefined,
                                universityCode: undefined,
                                employeeType: undefined,
                                active: undefined,
                                page: undefined,
                              })
                            }}
                            className="mt-1 text-xs text-[var(--primary)] transition-colors hover:underline"
                          >
                            {t('Clear')} {t('Filters').toLowerCase()}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`border-b border-[var(--border-color-pro)] transition-colors hover:bg-[var(--hover-bg)] ${
                        idx % 2 === 1 ? 'bg-[var(--table-row-alt)]' : 'bg-[var(--card-bg)]'
                      }`}
                    >
                      <td className="px-3 py-2 text-sm font-medium text-[var(--text-primary)]">
                        {row.employeeName || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                        {row.universityName || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                        {row.departmentName || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                        {row.employeeTypeName || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                        {row.positionName || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                        {row.jobStartDate || '-'}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={row.active ? 'default' : 'secondary'}>
                          {row.active ? t('Active') : t('Inactive')}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setSelectedId(row.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t('View')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[var(--border-color-pro)] px-4">
            <DataTablePagination
              page={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      </div>

      {selectedId && (
        <EmployeeJobDetailDrawer employeeJobId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  )
}
