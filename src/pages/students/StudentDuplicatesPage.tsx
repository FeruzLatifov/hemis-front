import { useState, useCallback, useMemo, lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Copy,
  AlertTriangle,
  Building2,
  CheckCircle,
  Layers,
  Users,
  Loader2,
  ArrowRightLeft,
  ArrowLeftRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import { useTranslation } from 'react-i18next'
import { PAGINATION } from '@/constants'
import { useDuplicateStats, useDuplicates } from '@/hooks/useStudents'
import type { DuplicateReason, DuplicateGroup, DuplicatesParams } from '@/api/students.api'

const DuplicateDetailDrawer = lazy(() => import('./DuplicateDetailDrawer'))

type ReasonTab = '' | DuplicateReason

const REASON_TABS: { key: ReasonTab; labelKey: string }[] = [
  { key: '', labelKey: 'All' },
  { key: 'CROSS_UNIVERSITY', labelKey: 'Cross university' },
  { key: 'SAME_UNIVERSITY', labelKey: 'Same university' },
  { key: 'MULTI_LEVEL', labelKey: 'Multi level' },
  { key: 'INTERNAL_TRANSFER', labelKey: 'Internal transfer' },
  { key: 'EXTERNAL_TRANSFER', labelKey: 'External transfer' },
  { key: 'NORMAL', labelKey: 'Normal' },
]

export default function StudentDuplicatesPage() {
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
  const reasonFilter = (searchParams.get('reason') || '') as ReasonTab

  // =====================================================
  // Local UI state
  // =====================================================
  const [selectedPinfl, setSelectedPinfl] = useState<string | null>(null)

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
  // Build query params
  // =====================================================
  const queryParams = useMemo<DuplicatesParams>(
    () => ({
      page: currentPage,
      size: pageSize,
      reason: reasonFilter || undefined,
    }),
    [currentPage, pageSize, reasonFilter],
  )

  // =====================================================
  // Data fetching
  // =====================================================
  const { data: stats, isLoading: statsLoading } = useDuplicateStats()
  const { data: pagedData, isLoading } = useDuplicates(queryParams)

  const groups = useMemo(() => pagedData?.content ?? [], [pagedData?.content])
  const totalElements = pagedData?.totalElements ?? 0
  const totalPages = pagedData?.totalPages ?? 0

  // =====================================================
  // Handlers
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

  const handleReasonChange = useCallback(
    (reason: ReasonTab) => {
      updateSearchParams({ reason: reason || undefined, page: undefined })
    },
    [updateSearchParams],
  )

  // =====================================================
  // Helpers
  // =====================================================
  const formatNumber = (n: number) => n.toLocaleString()

  const getReasonBadge = (reason: DuplicateReason) => {
    switch (reason) {
      case 'CROSS_UNIVERSITY':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
            <Building2 className="mr-1 h-3 w-3" />
            {t('Cross university')}
          </Badge>
        )
      case 'SAME_UNIVERSITY':
        return (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {t('Same university')}
          </Badge>
        )
      case 'MULTI_LEVEL':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            <Layers className="mr-1 h-3 w-3" />
            {t('Multi level')}
          </Badge>
        )
      case 'INTERNAL_TRANSFER':
        return (
          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400">
            <ArrowRightLeft className="mr-1 h-3 w-3" />
            {t('Internal transfer')}
          </Badge>
        )
      case 'EXTERNAL_TRANSFER':
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
            <ArrowLeftRight className="mr-1 h-3 w-3" />
            {t('External transfer')}
          </Badge>
        )
      case 'NORMAL':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t('Normal')}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{reason}</Badge>
    }
  }

  const getReasonTabCount = (key: ReasonTab): number => {
    if (!stats) return 0
    switch (key) {
      case '':
        return stats.totalDuplicatePinfls ?? 0
      case 'CROSS_UNIVERSITY':
        return stats.crossUniversityCount ?? 0
      case 'SAME_UNIVERSITY':
        return stats.sameUniversityCount ?? 0
      case 'MULTI_LEVEL':
        return stats.multiLevelCount ?? 0
      case 'INTERNAL_TRANSFER':
        return stats.internalTransferCount ?? 0
      case 'EXTERNAL_TRANSFER':
        return stats.externalTransferCount ?? 0
      case 'NORMAL':
        return stats.normalCount ?? 0
      default:
        return 0
    }
  }

  const getActiveLabel = (group: DuplicateGroup): string => {
    const inactive = group.count - group.activeCount
    if (group.activeCount === 0) return t('No active records')
    if (inactive === 0) return `${group.activeCount} ${t('active')}`
    return `${group.activeCount} ${t('active')}, ${inactive} ${t('inactive')}`
  }

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-bold text-[var(--primary)] dark:text-blue-400">
          {t('Duplicates')}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {t('Students with duplicate PINFL analysis')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="border border-[var(--border-color-pro)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Total duplicate PINFLs')}
                </p>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(stats?.totalDuplicatePinfls ?? 0)
                  )}
                </div>
              </div>
              <Copy className="h-10 w-10 text-slate-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-red-200 shadow-sm dark:border-red-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Cross university')}
                </p>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(stats?.crossUniversityCount ?? 0)
                  )}
                </div>
              </div>
              <Building2 className="h-10 w-10 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 shadow-sm dark:border-orange-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Same university')}
                </p>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(stats?.sameUniversityCount ?? 0)
                  )}
                </div>
              </div>
              <AlertTriangle className="h-10 w-10 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-200 shadow-sm dark:border-blue-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Multi level')}
                </p>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(stats?.multiLevelCount ?? 0)
                  )}
                </div>
              </div>
              <Layers className="h-10 w-10 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-teal-200 shadow-sm dark:border-teal-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('Internal transfer')}
                </p>
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(stats?.internalTransferCount ?? 0)
                  )}
                </div>
              </div>
              <ArrowRightLeft className="h-10 w-10 text-teal-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-200 shadow-sm dark:border-purple-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('External transfer')}
                </p>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatNumber(stats?.externalTransferCount ?? 0)
                  )}
                </div>
              </div>
              <ArrowLeftRight className="h-10 w-10 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reason Tabs + List */}
      <div className="rounded-lg border border-[var(--border-color-pro)] bg-white dark:bg-slate-950">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 px-4 py-2 dark:border-slate-800">
          {REASON_TABS.map((tab) => {
            const count = getReasonTabCount(tab.key)
            const isActive = reasonFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => handleReasonChange(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--active-bg)] text-[var(--primary)]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-900'
                }`}
              >
                {t(tab.labelKey)}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    isActive
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {statsLoading ? '-' : formatNumber(count)}
                </span>
              </button>
            )
          })}

          {/* Result count */}
          <span className="ml-auto text-xs text-gray-400">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              t('{{count}} groups found', { count: Number(totalElements) })
            )}
          </span>
        </div>

        {/* Groups list */}
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <Copy className="h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-gray-900 dark:text-slate-300">
                {t('No data found')}
              </p>
              <p className="text-xs text-gray-500">{t('No duplicate records found')}</p>
            </div>
          ) : (
            groups.map((group) => (
              <button
                key={group.pinfl}
                onClick={() => setSelectedPinfl(group.pinfl)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
              >
                {/* Name + PINFL */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-white">
                    {group.representativeName || group.pinfl}
                  </p>
                  <p className="font-mono text-xs text-slate-400">{group.pinfl}</p>
                </div>

                {/* Reason badge */}
                <div className="shrink-0">{getReasonBadge(group.reason)}</div>

                {/* Active summary */}
                <div className="hidden shrink-0 text-right text-sm sm:block">
                  <span className="text-slate-600 dark:text-slate-400">
                    {getActiveLabel(group)}
                  </span>
                </div>

                {/* Count */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                    {group.count}
                  </span>
                </div>
              </button>
            ))
          )}
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

      {/* Detail Drawer */}
      {selectedPinfl && (
        <Suspense fallback={null}>
          <DuplicateDetailDrawer pinfl={selectedPinfl} onClose={() => setSelectedPinfl(null)} />
        </Suspense>
      )}
    </div>
  )
}
