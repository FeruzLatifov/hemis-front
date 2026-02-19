import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  ChevronDown,
  Download,
  RefreshCw,
  Eye,
  Search,
  Building2,
  Loader2,
} from 'lucide-react'
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
import { type FacultyGroupRow, type FacultyRow } from '@/api/faculties.api'
import {
  useFacultyGroups,
  useFacultiesByUniversity,
  useExportFaculties,
} from '@/hooks/useFaculties'
import { useDebounce } from '@/hooks/useDebounce'
import { PAGINATION, UI } from '@/constants'
import { toast } from 'sonner'
import FacultyDetailDrawer from './FacultyDetailDrawer'

export default function FacultiesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  // URL-driven state
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
  const statusFromUrl = searchParams.get('status') || 'all'

  // Local UI state
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, UI.SEARCH_DEBOUNCE)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedFacultyCode, setSelectedFacultyCode] = useState<string | null>(null)

  // URL helpers
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

  // Sync debounced search to URL
  useEffect(() => {
    if (debouncedSearch !== searchFromUrl) {
      updateSearchParams({ q: debouncedSearch || undefined, page: undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Handlers
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

  const handleStatusChange = useCallback(
    (value: string) => {
      updateSearchParams({
        status: value !== 'all' ? value : undefined,
        page: undefined,
      })
    },
    [updateSearchParams],
  )

  // Fetch university groups
  const {
    data: groupsData,
    isLoading,
    isPlaceholderData,
    refetch,
  } = useFacultyGroups({
    search: debouncedSearch,
    status: statusFromUrl,
    page: currentPage,
  })

  const totalElements = groupsData?.totalElements ?? 0
  const totalPages = groupsData?.totalPages ?? 0

  // Fetch faculties for expanded universities
  const expandedUniversities = Object.keys(expanded).filter((key) => expanded[key])

  const facultyQueries = useFacultiesByUniversity(expandedUniversities, {
    search: debouncedSearch,
    status: statusFromUrl,
  })

  // Export
  const exportMutation = useExportFaculties()

  const handleExport = useCallback(() => {
    exportMutation.mutate({
      q: debouncedSearch || undefined,
      status: statusFromUrl === 'all' ? undefined : statusFromUrl === 'true',
    })
  }, [exportMutation, debouncedSearch, statusFromUrl])

  const handleRefresh = useCallback(() => {
    refetch()
    toast.success(t('Data refreshed'))
  }, [refetch, t])

  // Auto-expand all groups when searching
  useEffect(() => {
    if (!groupsData?.content) return
    const hasSearch = (debouncedSearch || '').trim().length > 0
    if (hasSearch) {
      const allExpanded: Record<string, boolean> = {}
      for (const g of groupsData.content) {
        allExpanded[g.universityCode] = true
      }
      setExpanded(allExpanded)
    }
  }, [groupsData, debouncedSearch])

  // Toggle expand
  const toggleExpand = useCallback((code: string) => {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }))
  }, [])

  // Build flat rows for rendering
  const rows = useMemo(() => {
    if (!groupsData?.content) return []

    const result: Array<
      | { type: 'group'; data: FacultyGroupRow }
      | { type: 'faculty'; data: FacultyRow; universityCode: string }
    > = []

    for (const group of groupsData.content) {
      result.push({ type: 'group', data: group })

      if (expanded[group.universityCode] && facultyQueries.data?.[group.universityCode]) {
        const faculties = facultyQueries.data[group.universityCode].content
        for (const faculty of faculties) {
          result.push({ type: 'faculty', data: faculty, universityCode: group.universityCode })
        }
      }
    }

    return result
  }, [groupsData, expanded, facultyQueries.data])

  const loading = isLoading && !isPlaceholderData
  const hasFilters = !!(debouncedSearch || statusFromUrl !== 'all')

  return (
    <>
      <div className="space-y-3 p-4">
        {/* Card container */}
        <div
          className="rounded-md border border-gray-200 bg-white"
          style={{ boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }}
        >
          {/* Toolbar */}
          <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2.5">
            {/* Search */}
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('Search...')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white py-1.5 pr-3 pl-9 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--active-bg)] focus:outline-none"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFromUrl} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All')}</SelectItem>
                <SelectItem value="true">{t('Active')}</SelectItem>
                <SelectItem value="false">{t('Inactive')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Total count */}
            <span className="text-xs text-gray-500 tabular-nums">
              {t('Total')}: <span className="font-semibold text-gray-700">{totalElements}</span>
            </span>

            <div className="h-5 w-px bg-gray-200" />

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('Refresh')}
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            >
              {exportMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t('Export')}
            </button>
          </div>

          {/* Progress bar */}
          {(isLoading || isPlaceholderData) && (
            <div className="progress-indeterminate h-0.5 w-full" />
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  <th className="w-10 bg-gray-50 px-3 py-2.5 text-left text-sm font-medium text-gray-500" />
                  <th className="bg-gray-50 px-3 py-2.5 text-left text-sm font-medium text-gray-500">
                    {t('University name')}
                  </th>
                  <th className="w-32 bg-gray-50 px-3 py-2.5 text-left text-sm font-medium text-gray-500">
                    {t('Code')}
                  </th>
                  <th className="w-64 bg-gray-50 px-3 py-2.5 text-left text-sm font-medium text-gray-500">
                    {t('Faculty count')}
                  </th>
                  <th className="w-28 bg-gray-50 px-3 py-2.5 text-left text-sm font-medium text-gray-500">
                    {t('Status')}
                  </th>
                  <th className="w-24 bg-gray-50 px-3 py-2.5 text-left text-sm font-medium text-gray-500">
                    {t('Actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-full rounded" />
                      </td>
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-20 rounded" />
                      </td>
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-32 rounded" />
                      </td>
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-16 rounded" />
                      </td>
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-12 rounded" />
                      </td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Building2 className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t('No data found')}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {hasFilters
                              ? t('Try changing your search or filters')
                              : t('No faculties have been added yet')}
                          </p>
                        </div>
                        {hasFilters && (
                          <button
                            onClick={() => {
                              setSearchInput('')
                              updateSearchParams({
                                q: undefined,
                                status: undefined,
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
                  rows.map((row, idx) => {
                    if (row.type === 'group') {
                      const group = row.data
                      const isExpanded = expanded[group.universityCode]
                      return (
                        <tr
                          key={`group-${group.universityCode}`}
                          className={`cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 ${
                            idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                          }`}
                          onClick={() => toggleExpand(group.universityCode)}
                        >
                          <td className="px-3 py-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {group.universityName}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {group.universityCode}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <span className="font-medium">{group.facultyCount}</span>
                            <span className="ml-1 text-gray-500">
                              ({t('Active')}: {group.activeFacultyCount} / {t('Inactive')}:{' '}
                              {group.inactiveFacultyCount})
                            </span>
                          </td>
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2" />
                        </tr>
                      )
                    }

                    // Faculty row (child — indented, subtle background)
                    const faculty = row.data
                    return (
                      <tr
                        key={`faculty-${faculty.code}`}
                        className="border-b border-gray-200 bg-gray-50 transition-colors hover:bg-gray-100"
                      >
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2 pl-9 text-sm text-gray-700">{faculty.nameUz}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{faculty.code}</td>
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2">
                          <Badge variant={faculty.status ? 'default' : 'secondary'}>
                            {faculty.status ? t('Active') : t('Inactive')}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setSelectedFacultyCode(faculty.code)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {t('View')}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 px-4">
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

      {/* Faculty Detail Drawer */}
      {selectedFacultyCode && (
        <FacultyDetailDrawer
          facultyCode={selectedFacultyCode}
          onClose={() => setSelectedFacultyCode(null)}
        />
      )}
    </>
  )
}
