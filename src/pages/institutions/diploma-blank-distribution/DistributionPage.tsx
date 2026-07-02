import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Download,
  RefreshCw,
  Eye,
  Search,
  FileText,
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import { useStableCallback } from '@/hooks/useStableCallback'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuthStore } from '@/stores/authStore'
import { hasPermission } from '@/services/auth.service'
import { PAGINATION, UI } from '@/constants'
import { toast } from 'sonner'
import type { DiplomaBlankDistributionRow } from '@/api/diplomaBlankDistribution.api'
import {
  useDiplomaBlankDistributions,
  useDiplomaBlankDistributionDictionaries,
  useDeleteDiplomaBlankDistribution,
  useExportDiplomaBlankDistributions,
} from '@/hooks/useDiplomaBlankDistribution'
import DistributionFormDialog from './DistributionFormDialog'
import DistributionDetailDrawer from './DistributionDetailDrawer'

export default function DistributionPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const permissions = useAuthStore((state) => state.permissions)
  const canCreate = hasPermission(permissions, 'institutions.diploma-blank-distribution.create')
  const canEdit = hasPermission(permissions, 'institutions.diploma-blank-distribution.edit')
  const canDelete = hasPermission(permissions, 'institutions.diploma-blank-distribution.delete')

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
  const educationYearFromUrl = searchParams.get('educationYear') || 'all'
  const blankCategoryFromUrl = searchParams.get('blankCategory') || 'all'

  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebounce(searchInput, UI.SEARCH_DEBOUNCE)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<DiplomaBlankDistributionRow | null>(null)
  const [deletingRow, setDeletingRow] = useState<DiplomaBlankDistributionRow | null>(null)

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

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      updateSearchParams({ [key]: value !== 'all' ? value : undefined, page: undefined })
    },
    [updateSearchParams],
  )

  const { data: dictionaries } = useDiplomaBlankDistributionDictionaries()

  const listParams = {
    q: debouncedSearch || undefined,
    universityCode: universityFromUrl !== 'all' ? universityFromUrl : undefined,
    educationYear: educationYearFromUrl !== 'all' ? educationYearFromUrl : undefined,
    blankCategory: blankCategoryFromUrl !== 'all' ? blankCategoryFromUrl : undefined,
    page: currentPage,
    size: pageSize,
  }

  const { data, isLoading, isPlaceholderData, refetch } = useDiplomaBlankDistributions(listParams)

  const rows = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0

  const exportMutation = useExportDiplomaBlankDistributions()
  const deleteMutation = useDeleteDiplomaBlankDistribution()

  const handleExport = useCallback(() => {
    exportMutation.mutate({
      q: debouncedSearch || undefined,
      universityCode: universityFromUrl !== 'all' ? universityFromUrl : undefined,
      educationYear: educationYearFromUrl !== 'all' ? educationYearFromUrl : undefined,
      blankCategory: blankCategoryFromUrl !== 'all' ? blankCategoryFromUrl : undefined,
    })
  }, [
    exportMutation,
    debouncedSearch,
    universityFromUrl,
    educationYearFromUrl,
    blankCategoryFromUrl,
  ])

  const handleRefresh = useCallback(() => {
    refetch()
    toast.success(t('Data refreshed'))
  }, [refetch, t])

  const handleAdd = useCallback(() => {
    setEditingRow(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((row: DiplomaBlankDistributionRow) => {
    setEditingRow(row)
    setFormOpen(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deletingRow) return
    deleteMutation.mutate(deletingRow.id, {
      onSettled: () => setDeletingRow(null),
    })
  }, [deletingRow, deleteMutation])

  const loading = isLoading && !isPlaceholderData
  const hasFilters = !!(
    debouncedSearch ||
    universityFromUrl !== 'all' ||
    educationYearFromUrl !== 'all' ||
    blankCategoryFromUrl !== 'all'
  )

  return (
    <>
      <div className="space-y-3 p-4">
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

            <Select
              value={universityFromUrl}
              onValueChange={(v) => handleFilterChange('universityCode', v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('University')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('University')}</SelectItem>
                {(dictionaries?.universities ?? []).map((u) => (
                  <SelectItem key={u.code} value={u.code}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={educationYearFromUrl}
              onValueChange={(v) => handleFilterChange('educationYear', v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('Education year')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Education year')}</SelectItem>
                {(dictionaries?.educationYears ?? []).map((e) => (
                  <SelectItem key={e.code} value={e.code}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={blankCategoryFromUrl}
              onValueChange={(v) => handleFilterChange('blankCategory', v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('Blank category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Blank category')}</SelectItem>
                {(dictionaries?.blankCategories ?? []).map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
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

            {canCreate && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                {t('Add distribution')}
              </button>
            )}
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
                    {t('University name')}
                  </th>
                  <th className="w-40 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Blank category')}
                  </th>
                  <th className="w-24 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Series')}
                  </th>
                  <th className="w-28 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Start number')}
                  </th>
                  <th className="w-28 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('End number')}
                  </th>
                  <th className="w-24 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Quantity')}
                  </th>
                  <th className="w-40 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                    {t('Distribution date')}
                  </th>
                  <th className="w-28 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
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
                        <FileText className="h-8 w-8 text-[var(--text-secondary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {t('No data found')}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                            {hasFilters
                              ? t('Try changing your search or filters')
                              : t('No distributions have been added yet')}
                          </p>
                        </div>
                        {hasFilters && (
                          <button
                            onClick={() => {
                              setSearchInput('')
                              updateSearchParams({
                                q: undefined,
                                universityCode: undefined,
                                educationYear: undefined,
                                blankCategory: undefined,
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
                        {row.universityName || row.universityCode}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                        {row.blankCategoryName || row.blankCategory || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                        {row.blankSeria}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)] tabular-nums">
                        {row.blankStartNumber}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)] tabular-nums">
                        {row.blankEndNumber}
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-[var(--text-primary)] tabular-nums">
                        {row.quantity}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                        {row.distributionDate || '-'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedId(row.id)}
                            aria-label={t('View')}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(row)}
                              aria-label={t('Edit')}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeletingRow(row)}
                              aria-label={t('Delete')}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--error)] transition-colors hover:bg-[var(--hover-bg)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
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

      {(canCreate || canEdit) && (
        <DistributionFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editingRow} />
      )}

      {selectedId && (
        <DistributionDetailDrawer distributionId={selectedId} onClose={() => setSelectedId(null)} />
      )}

      <AlertDialog open={!!deletingRow} onOpenChange={(open) => !open && setDeletingRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete')}?</AlertDialogTitle>
            <AlertDialogDescription>{t('This action cannot be undone')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
