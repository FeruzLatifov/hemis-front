import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Users,
  UserX,
  Search,
  GraduationCap,
  UserCheck,
  UserMinus,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import { useTranslation } from 'react-i18next'
import { PAGINATION, UI } from '@/constants'
import { useSpecialityStats, useSpecialitySummary } from '@/hooks/useStudents'
import type { DirectionsParams } from '@/api/students.api'

type EducationTypeTab = '' | 'BACHELOR' | 'MASTER' | 'ORDINATURA'

const EDUCATION_TYPE_TABS: { key: EducationTypeTab; labelKey: string }[] = [
  { key: '', labelKey: 'All' },
  { key: 'BACHELOR', labelKey: 'Bachelor' },
  { key: 'MASTER', labelKey: 'Master' },
  { key: 'ORDINATURA', labelKey: 'Ordinatura' },
]

export default function StudentDirectionsPage() {
  const { t } = useTranslation()

  // =====================================================
  // URL-driven state
  // =====================================================
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0)
  const pageSize = Math.max(
    1,
    Math.min(100, parseInt(searchParams.get('size') || String(PAGINATION.DEFAULT_PAGE_SIZE), 10)),
  )
  const educationTypeFilter = (searchParams.get('educationType') || '') as EducationTypeTab
  const searchQuery = searchParams.get('search') || ''
  const hasStudentsParam = searchParams.get('hasStudents')
  const hasStudentsFilter =
    hasStudentsParam === 'true' ? true : hasStudentsParam === 'false' ? false : undefined

  // =====================================================
  // Local UI state for search input (debounced)
  // =====================================================
  const [searchInput, setSearchInput] = useState(searchQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Sync search input when URL changes externally
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  // =====================================================
  // URL update helper
  // =====================================================
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

  // =====================================================
  // Handlers
  // =====================================================
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateSearchParams({ search: value || undefined, page: undefined })
      }, UI.SEARCH_DEBOUNCE)
    },
    [updateSearchParams],
  )

  const handleEducationTypeChange = useCallback(
    (type: EducationTypeTab) => {
      updateSearchParams({ educationType: type || undefined, page: undefined })
    },
    [updateSearchParams],
  )

  const handleHasStudentsChange = useCallback(
    (value: boolean | undefined) => {
      updateSearchParams({
        hasStudents: value !== undefined ? String(value) : undefined,
        page: undefined,
      })
    },
    [updateSearchParams],
  )

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

  // =====================================================
  // Build query params
  // =====================================================
  const queryParams = useMemo<DirectionsParams>(
    () => ({
      page: currentPage,
      size: pageSize,
      search: searchQuery || undefined,
      educationType: educationTypeFilter || undefined,
      hasStudents: hasStudentsFilter,
    }),
    [currentPage, pageSize, searchQuery, educationTypeFilter, hasStudentsFilter],
  )

  // =====================================================
  // Data fetching
  // =====================================================
  const { data: summary, isLoading: summaryLoading } = useSpecialitySummary()
  const { data: pagedData, isLoading } = useSpecialityStats(queryParams)

  const specialities = useMemo(() => pagedData?.content ?? [], [pagedData?.content])
  const totalElements = pagedData?.totalElements ?? 0
  const totalPages = pagedData?.totalPages ?? 0

  // =====================================================
  // Helpers
  // =====================================================
  const formatNumber = (n: number) => n.toLocaleString()

  const getEducationTypeBadge = (type: string) => {
    switch (type) {
      case 'BACHELOR':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            {t('Bachelor')}
          </Badge>
        )
      case 'MASTER':
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
            {t('Master')}
          </Badge>
        )
      case 'ORDINATURA':
        return (
          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400">
            {t('Ordinatura')}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-bold text-[var(--primary)] dark:text-blue-400">
          {t('Directions')}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {t('Speciality statistics by education type')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Total specialities')}
                </p>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(summary?.totalSpecialities ?? 0)
                  )}
                </div>
              </div>
              <BookOpen className="h-10 w-10 text-slate-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-green-200 shadow-sm dark:border-green-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('With students')}
                </p>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(summary?.withStudents ?? 0)
                  )}
                </div>
              </div>
              <Users className="h-10 w-10 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 shadow-sm dark:border-orange-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Without students')}
                </p>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(summary?.withoutStudents ?? 0)
                  )}
                </div>
              </div>
              <UserX className="h-10 w-10 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <div className="rounded-lg border border-[var(--border-color-pro)] bg-white dark:bg-slate-950">
        {/* Toolbar: Search + Education Type Tabs + HasStudents filter */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-slate-800">
          {/* Search input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('Search by speciality...')}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-3 pl-9 text-sm transition-colors outline-none placeholder:text-gray-400 focus:border-blue-300 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500 dark:focus:border-blue-600 dark:focus:bg-slate-950"
            />
          </div>

          {/* Education type tabs */}
          <div className="flex items-center gap-1">
            {EDUCATION_TYPE_TABS.map((tab) => {
              const isActive = educationTypeFilter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => handleEducationTypeChange(tab.key)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--active-bg)] text-[var(--primary)]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-900'
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              )
            })}
          </div>

          {/* Has students filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleHasStudentsChange(hasStudentsFilter === true ? undefined : true)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                hasStudentsFilter === true
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-900'
              }`}
            >
              {t('Has students')}
            </button>
            <button
              onClick={() =>
                handleHasStudentsChange(hasStudentsFilter === false ? undefined : false)
              }
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                hasStudentsFilter === false
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-900'
              }`}
            >
              {t('No students')}
            </button>
          </div>

          {/* Result count */}
          <span className="ml-auto text-xs text-gray-400">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              t('{{count}} specialities found', { count: Number(totalElements) })
            )}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-slate-400">
                  {t('Speciality code')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-slate-400">
                  {t('Speciality name')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-slate-400">
                  {t('Education type')}
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-slate-400">
                  {t('Total students')}
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    {t('Active students')}
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {t('Graduated')}
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <UserMinus className="h-3.5 w-3.5" />
                    {t('Expelled')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3" colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : specialities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-300">
                        {t('No data found')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                specialities.map((sp) => (
                  <tr
                    key={sp.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{sp.code}</td>
                    <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {sp.name}
                    </td>
                    <td className="px-4 py-3">{getEducationTypeBadge(sp.educationType)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                      {formatNumber(sp.totalStudents)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                      {formatNumber(sp.activeStudents)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                      {formatNumber(sp.graduatedStudents)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                      {formatNumber(sp.expelledStudents)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalElements > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 dark:border-slate-800">
            <DataTablePagination
              page={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
