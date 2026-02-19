import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Users,
  Award,
  GraduationCap,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import { useTranslation } from 'react-i18next'
import { PAGINATION, UI } from '@/constants'
import { useStudents, useStudentStats, useStudentDictionaries } from '@/hooks/useStudents'
import type { StudentsParams, StudentRow } from '@/api/students.api'
import { StudentsFilters, STUDENT_FILTER_KEYS, type StudentsFilterValues } from './StudentsFilters'

export default function Students() {
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
  const searchFromUrl = (searchParams.get('q') || '').slice(0, 200)
  const searchFieldFromUrl = (searchParams.get('searchField') || 'code') as 'code' | 'pinfl'

  // Filter values from URL
  const studentStatusFilter = searchParams.get('studentStatus') || ''
  const paymentFormFilter = searchParams.get('paymentForm') || ''
  const educationTypeFilter = searchParams.get('educationType') || ''
  const educationFormFilter = searchParams.get('educationForm') || ''
  const courseFilter = searchParams.get('course') || ''
  const genderFilter = searchParams.get('gender') || ''

  // =====================================================
  // Local UI state
  // =====================================================
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const [searchField, setSearchField] = useState<'code' | 'pinfl'>(searchFieldFromUrl)
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const [showFiltersPanel, setShowFiltersPanel] = useState(
    () =>
      !!(
        studentStatusFilter ||
        paymentFormFilter ||
        educationTypeFilter ||
        educationFormFilter ||
        courseFilter ||
        genderFilter
      ),
  )

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
  // Debounced search
  // =====================================================
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, UI.SEARCH_DEBOUNCE)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [searchInput])

  useEffect(() => {
    if (debouncedSearch !== searchFromUrl) {
      updateSearchParams({ q: debouncedSearch || undefined, page: undefined })
    }
  }, [debouncedSearch, searchFromUrl, updateSearchParams])

  // =====================================================
  // Filter values object for StudentsFilters
  // =====================================================
  const filterValues = useMemo<StudentsFilterValues>(
    () => ({
      studentStatus: studentStatusFilter,
      paymentForm: paymentFormFilter,
      educationType: educationTypeFilter,
      educationForm: educationFormFilter,
      course: courseFilter,
      gender: genderFilter,
    }),
    [
      studentStatusFilter,
      paymentFormFilter,
      educationTypeFilter,
      educationFormFilter,
      courseFilter,
      genderFilter,
    ],
  )

  const hasActiveFilters = !!(
    studentStatusFilter ||
    paymentFormFilter ||
    educationTypeFilter ||
    educationFormFilter ||
    courseFilter ||
    genderFilter
  )

  const activeFilterCount = [
    studentStatusFilter,
    paymentFormFilter,
    educationTypeFilter,
    educationFormFilter,
    courseFilter,
    genderFilter,
  ].filter(Boolean).length

  // =====================================================
  // Build query params
  // =====================================================
  const queryParams = useMemo<StudentsParams>(
    () => ({
      page: currentPage,
      size: pageSize,
      q: debouncedSearch || undefined,
      searchField: debouncedSearch ? searchField : undefined,
      studentStatus: studentStatusFilter || undefined,
      paymentForm: paymentFormFilter || undefined,
      educationType: educationTypeFilter || undefined,
      educationForm: educationFormFilter || undefined,
      course: courseFilter || undefined,
      gender: genderFilter || undefined,
    }),
    [
      currentPage,
      pageSize,
      debouncedSearch,
      searchField,
      studentStatusFilter,
      paymentFormFilter,
      educationTypeFilter,
      educationFormFilter,
      courseFilter,
      genderFilter,
    ],
  )

  // =====================================================
  // Data fetching
  // =====================================================
  const { data: pagedData, isLoading } = useStudents(queryParams)
  const { data: stats, isLoading: statsLoading } = useStudentStats()
  const { data: dictionaries } = useStudentDictionaries()

  const students = useMemo(() => pagedData?.content ?? [], [pagedData?.content])
  const totalElements = pagedData?.totalElements ?? 0
  const totalPages = pagedData?.totalPages ?? 0

  // =====================================================
  // Code → Name resolver using dictionaries
  // =====================================================
  const resolveName = useCallback(
    (
      dictKey:
        | 'courses'
        | 'studentStatuses'
        | 'paymentForms'
        | 'educationTypes'
        | 'educationForms'
        | 'genders',
      code: string,
    ): string => {
      if (!code || !dictionaries) return code || '\u2014'
      const items = dictionaries[dictKey]
      return items?.find((item) => item.code === code)?.name || code
    },
    [dictionaries],
  )

  // =====================================================
  // Pagination handlers
  // =====================================================
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
  // Filter handlers
  // =====================================================
  const handleFilterChange = useCallback(
    (key: string, values: string[]) => {
      updateSearchParams({
        [key]: values.length > 0 ? values.join(',') : undefined,
        page: undefined,
      })
    },
    [updateSearchParams],
  )

  const handleClearFilters = useCallback(() => {
    setSearchInput('')
    setDebouncedSearch('')
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    const clearObj: Record<string, undefined> = { q: undefined, page: undefined, size: undefined }
    for (const key of STUDENT_FILTER_KEYS) {
      clearObj[key] = undefined
    }
    updateSearchParams(clearObj)
  }, [updateSearchParams])

  // =====================================================
  // Keyboard shortcut: Ctrl+K to focus search
  // =====================================================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('students-search')?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // =====================================================
  // Helper functions
  // =====================================================
  const getStatusBadge = (status: string) => {
    const name = resolveName('studentStatuses', status)
    switch (status) {
      case '10':
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400">
            <Clock className="mr-1 h-3 w-3" />
            {name}
          </Badge>
        )
      case '11':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            {name}
          </Badge>
        )
      case '12':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
            <XCircle className="mr-1 h-3 w-3" />
            {name}
          </Badge>
        )
      case '13':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">
            <Clock className="mr-1 h-3 w-3" />
            {name}
          </Badge>
        )
      case '14':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            <Award className="mr-1 h-3 w-3" />
            {name}
          </Badge>
        )
      case '15':
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
            <Clock className="mr-1 h-3 w-3" />
            {name}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{name}</Badge>
    }
  }

  const getPaymentBadge = (form: string) => {
    const name = resolveName('paymentForms', form)
    switch (form) {
      case '11':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <GraduationCap className="mr-1 h-3 w-3" />
            {name}
          </Badge>
        )
      case '12':
        return (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
            {name}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{name}</Badge>
    }
  }

  const formatNumber = (n: number) => n.toLocaleString()

  const getInitials = (student: StudentRow) => {
    const first = (student.lastname || '?')[0]
    const second = (student.firstname || '?')[0]
    return `${first}${second}`.toUpperCase()
  }

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-[var(--primary)] dark:text-blue-400">
            {t('Students')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {t('Student list and management')}
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Total')}
                </p>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(stats?.total ?? 0)
                  )}
                </div>
              </div>
              <Users className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Grant recipients')}
                </p>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(stats?.grantCount ?? 0)
                  )}
                </div>
              </div>
              <GraduationCap className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Contract students')}
                </p>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(stats?.contractCount ?? 0)
                  )}
                </div>
              </div>
              <Award className="h-10 w-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Graduates')}
                </p>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(stats?.graduateCount ?? 0)
                  )}
                </div>
              </div>
              <Award className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table with Toolbar + Filters */}
      <div className="rounded-lg border border-[var(--border-color-pro)] bg-white dark:bg-slate-950">
        {/* ──── Toolbar ──── */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-slate-800">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              showFiltersPanel || activeFilterCount > 0
                ? 'border-[var(--primary)]/20 bg-[var(--active-bg)] text-[var(--primary)]'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{t('Filters')}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search field selector + input */}
          <div className="flex flex-1 items-center gap-0">
            <select
              value={searchField}
              onChange={(e) => {
                const val = e.target.value as 'code' | 'pinfl'
                setSearchField(val)
                updateSearchParams({
                  searchField: val === 'code' ? undefined : val,
                  page: undefined,
                })
              }}
              className="h-8 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 px-2 text-xs font-medium text-gray-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="code">{t('Code')}</option>
              <option value="pinfl">{t('PINFL')}</option>
            </select>
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="students-search"
                placeholder={`${searchField === 'pinfl' ? t('Search by PINFL...') : t('Search by code...')} (Ctrl+K)`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-8 rounded-l-none border-0 bg-transparent pl-9 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Result count */}
          <span className="text-xs text-gray-400">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              t('{{count}} students found', { count: formatNumber(totalElements) })
            )}
          </span>
        </div>

        {/* ──── Filters Panel ──── */}
        <StudentsFilters
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          showPanel={showFiltersPanel}
          hasActiveFilters={hasActiveFilters}
          dictionaries={
            dictionaries ?? {
              courses: [],
              studentStatuses: [],
              paymentForms: [],
              educationTypes: [],
              educationForms: [],
              genders: [],
            }
          }
          t={t}
        />

        {/* ──── Table ──── */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>{t('Code')}</TableHead>
                <TableHead>{t('Full name')}</TableHead>
                <TableHead>PINFL</TableHead>
                <TableHead>{t('Course')}</TableHead>
                <TableHead>{t('Education type')}</TableHead>
                <TableHead>{t('Education form')}</TableHead>
                <TableHead>{t('Payment')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead className="text-right">{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-300">
                        {t('No data found')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {debouncedSearch || hasActiveFilters
                          ? t('Try changing your search or filters')
                          : t('No students found')}
                      </p>
                      {(debouncedSearch || hasActiveFilters) && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-1 text-xs text-[var(--primary)] transition-colors hover:underline"
                        >
                          {t('Clear')} {t('Filters').toLowerCase()}
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow
                    key={student.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <TableCell className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                      {student.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                          {getInitials(student)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">
                            {student.fullName}
                          </p>
                          {student.groupName && (
                            <p className="truncate text-xs text-slate-500">{student.groupName}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-400">
                      {student.pinfl}
                    </TableCell>
                    <TableCell>
                      {student.course ? (
                        <Badge variant="secondary">{resolveName('courses', student.course)}</Badge>
                      ) : (
                        '\u2014'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                        {resolveName('educationTypes', student.educationType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {resolveName('educationForms', student.educationForm)}
                      </span>
                    </TableCell>
                    <TableCell>{getPaymentBadge(student.paymentForm)}</TableCell>
                    <TableCell>{getStatusBadge(student.studentStatus)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('View')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('Edit')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
