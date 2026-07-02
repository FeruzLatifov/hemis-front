import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStableCallback } from '@/hooks/useStableCallback'
import {
  ChevronRight,
  ChevronDown,
  Download,
  RefreshCw,
  Eye,
  Search,
  Users,
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
import { type GroupGroupRow, type GroupRegistryRow } from '@/api/groups.api'
import {
  useGroupGroups,
  useGroupsByUniversity,
  useGroupDictionaries,
  useExportGroups,
} from '@/hooks/useGroups'
import { useDebounce } from '@/hooks/useDebounce'
import { PAGINATION, UI } from '@/constants'
import { toast } from 'sonner'
import GroupDetailDrawer from './GroupDetailDrawer'

export default function GroupsPage() {
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
  const educationTypeFromUrl = searchParams.get('educationType') || 'all'
  const educationYearFromUrl = searchParams.get('educationYear') || 'all'

  // Local UI state
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, UI.SEARCH_DEBOUNCE)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  // Dictionaries (education types / years for filters)
  const { data: dictionaries } = useGroupDictionaries()

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

  // One-way sync from local state → URL via stable callback (latest values, stable identity).
  const syncSearchToUrl = useStableCallback(() => {
    if (debouncedSearch !== searchFromUrl) {
      updateSearchParams({ q: debouncedSearch || undefined, page: undefined })
    }
  })

  useEffect(() => {
    syncSearchToUrl()
  }, [debouncedSearch, syncSearchToUrl])

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

  const handleEducationTypeChange = useCallback(
    (value: string) => {
      updateSearchParams({
        educationType: value !== 'all' ? value : undefined,
        page: undefined,
      })
    },
    [updateSearchParams],
  )

  const handleEducationYearChange = useCallback(
    (value: string) => {
      updateSearchParams({
        educationYear: value !== 'all' ? value : undefined,
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
  } = useGroupGroups({
    search: debouncedSearch,
    status: statusFromUrl,
    page: currentPage,
  })

  const totalElements = groupsData?.totalElements ?? 0
  const totalPages = groupsData?.totalPages ?? 0

  // Fetch groups for expanded universities
  const expandedUniversities = Object.keys(expanded).filter((key) => expanded[key])

  const groupQueries = useGroupsByUniversity(expandedUniversities, {
    search: debouncedSearch,
    educationType: educationTypeFromUrl,
    educationYear: educationYearFromUrl,
    status: statusFromUrl,
  })

  // Export
  const exportMutation = useExportGroups()

  const handleExport = useCallback(() => {
    exportMutation.mutate({
      q: debouncedSearch || undefined,
      educationType: educationTypeFromUrl === 'all' ? undefined : educationTypeFromUrl,
      educationYear: educationYearFromUrl === 'all' ? undefined : educationYearFromUrl,
      status: statusFromUrl === 'all' ? undefined : statusFromUrl === 'true',
    })
  }, [exportMutation, debouncedSearch, educationTypeFromUrl, educationYearFromUrl, statusFromUrl])

  const handleRefresh = useCallback(() => {
    refetch()
    toast.success(t('Data refreshed'))
  }, [refetch, t])

  // Auto-expand all groups when searching or filtering
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
      | { type: 'group'; data: GroupGroupRow }
      | { type: 'studentGroup'; data: GroupRegistryRow; universityCode: string }
    > = []

    for (const group of groupsData.content) {
      result.push({ type: 'group', data: group })

      if (expanded[group.universityCode] && groupQueries.data?.[group.universityCode]) {
        const studentGroups = groupQueries.data[group.universityCode].content
        for (const studentGroup of studentGroups) {
          result.push({
            type: 'studentGroup',
            data: studentGroup,
            universityCode: group.universityCode,
          })
        }
      }
    }

    return result
  }, [groupsData, expanded, groupQueries.data])

  const loading = isLoading && !isPlaceholderData
  const hasFilters = !!(
    debouncedSearch ||
    statusFromUrl !== 'all' ||
    educationTypeFromUrl !== 'all' ||
    educationYearFromUrl !== 'all'
  )

  return (
    <>
      <div className="space-y-3 p-4">
        {/* Card container */}
        <div className="rounded-md border border-[var(--border-color-pro)] bg-[var(--card-bg)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color-pro)] px-4 py-2.5">
            {/* Search */}
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

            {/* Education type filter */}
            <Select value={educationTypeFromUrl} onValueChange={handleEducationTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('Education type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Education type')}</SelectItem>
                {dictionaries?.educationTypes?.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Education year filter */}
            <Select value={educationYearFromUrl} onValueChange={handleEducationYearChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('Education year')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Education year')}</SelectItem>
                {dictionaries?.educationYears?.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFromUrl} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px]">
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
            <span className="text-xs text-[var(--text-secondary)] tabular-nums">
              {t('Total')}:{' '}
              <span className="font-semibold text-[var(--text-primary)]">{totalElements}</span>
            </span>

            <div className="h-5 w-px bg-[var(--border-color-pro)]" />

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('Refresh')}
            </button>

            {/* Export */}
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

          {/* Progress bar */}
          {(isLoading || isPlaceholderData) && (
            <div className="progress-indeterminate h-0.5 w-full" />
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[var(--border-color-pro)]">
                  <th className="w-10 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]" />
                  <th className="bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('University name')}
                  </th>
                  <th className="w-40 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Group ID')}
                  </th>
                  <th className="w-40 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Education type')}
                  </th>
                  <th className="w-32 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Education year')}
                  </th>
                  <th className="w-56 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Group count')}
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
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-full rounded" />
                      </td>
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-24 rounded" />
                      </td>
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-24 rounded" />
                      </td>
                      <td className="px-3 py-2">
                        <Skeleton className="h-4 w-16 rounded" />
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
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="h-8 w-8 text-[var(--text-secondary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {t('No data found')}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                            {hasFilters
                              ? t('Try changing your search or filters')
                              : t('No groups have been added yet')}
                          </p>
                        </div>
                        {hasFilters && (
                          <button
                            onClick={() => {
                              setSearchInput('')
                              updateSearchParams({
                                q: undefined,
                                status: undefined,
                                educationType: undefined,
                                educationYear: undefined,
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
                          className={`cursor-pointer border-b border-[var(--border-color-pro)] transition-colors hover:bg-[var(--hover-bg)] ${
                            idx % 2 === 1 ? 'bg-[var(--table-row-alt)]' : 'bg-[var(--card-bg)]'
                          }`}
                          onClick={() => toggleExpand(group.universityCode)}
                        >
                          <td className="px-3 py-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-[var(--text-primary)]">
                            {group.universityName}
                          </td>
                          <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                            {group.universityCode}
                          </td>
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2 text-sm">
                            <span className="font-medium">{group.groupCount}</span>
                            <span className="ml-1 text-[var(--text-secondary)]">
                              ({t('Active')}: {group.activeGroupCount} / {t('Inactive')}:{' '}
                              {group.inactiveGroupCount})
                            </span>
                          </td>
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2" />
                        </tr>
                      )
                    }

                    // Study-group row (child — indented, subtle background)
                    const studentGroup = row.data
                    return (
                      <tr
                        key={`student-group-${studentGroup.id}`}
                        className="border-b border-[var(--border-color-pro)] bg-[var(--table-row-alt)] transition-colors hover:bg-[var(--hover-bg)]"
                      >
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2 pl-9 text-sm text-[var(--text-primary)]">
                          {studentGroup.groupName}
                        </td>
                        <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                          {studentGroup.groupId}
                        </td>
                        <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                          {studentGroup.educationTypeName || studentGroup.educationTypeCode || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                          {studentGroup.educationYearName || studentGroup.educationYearCode || '-'}
                        </td>
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2">
                          <Badge variant={studentGroup.active ? 'default' : 'secondary'}>
                            {studentGroup.active ? t('Active') : t('Inactive')}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setSelectedGroupId(studentGroup.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
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

      {/* Group Detail Drawer */}
      {selectedGroupId && (
        <GroupDetailDrawer groupId={selectedGroupId} onClose={() => setSelectedGroupId(null)} />
      )}
    </>
  )
}
