import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RefreshCw, GraduationCap, Download, Loader2, Plus, Trash2, Pencil } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { SearchableSelect } from '@/components/filters/SearchableSelect'
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import { PAGINATION } from '@/constants'
import { toast } from 'sonner'
import { usePermission } from '@/hooks/usePermission'
import {
  useSpecialityAttachments,
  useSpecialityAttachmentFilterOptions,
  useDeleteSpecialityAttachment,
} from '@/hooks/useSpecialityAttachments'
import { specialityAttachmentsApi } from '@/api/specialityAttachments.api'
import type { SpecialityAttachmentRow } from '@/api/specialityAttachments.api'
import { specialityLevelKey } from '@/pages/classifiers/speciality/speciality-tree.util'
import { SpecialityAttachmentCreateDialog } from './SpecialityAttachmentCreateDialog'
import { SpecialityAttachmentEditDialog } from './SpecialityAttachmentEditDialog'

// Attachment status → human-readable i18n key (mirrors how /classifiers/speciality localizes its
// reviewStatus). 'Active'/'Suspended' keys already exist; a REVOKED row does not currently occur.
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Inactive',
  REVOKED: 'Inactive',
}

export default function SpecialityAttachmentsPage() {
  const { t } = useTranslation()
  const { canAny } = usePermission()
  const canCreate = canAny(['institutions.speciality-attachments.create'])
  const canDelete = canAny(['institutions.speciality-attachments.delete'])
  // Edit reuses the create (write) permission — there is no separate `.edit` grant.
  const canEdit = canCreate
  const hasActions = canEdit || canDelete
  const [searchParams, setSearchParams] = useSearchParams()
  const [exporting, setExporting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SpecialityAttachmentRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SpecialityAttachmentRow | null>(null)
  const deleteMutation = useDeleteSpecialityAttachment()
  // The actions column appears when the user can edit and/or delete.
  const colCount = hasActions ? 9 : 8

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
  const universityFromUrl = searchParams.get('universityCode') || 'all'
  const eduTypeFromUrl = searchParams.get('educationType') || 'all'
  const eduFormFromUrl = searchParams.get('educationForm') || 'all'
  const eduYearFromUrl = searchParams.get('eduYear') || 'all'
  // Numeric year for the API — guards a hand-tampered ?eduYear=abc from sending NaN (→ 400).
  const eduYearNum =
    eduYearFromUrl !== 'all' && Number.isFinite(Number(eduYearFromUrl))
      ? Number(eduYearFromUrl)
      : undefined

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

  const handlePageChange = useCallback(
    (page: number) => updateSearchParams({ page: page > 0 ? String(page) : undefined }),
    [updateSearchParams],
  )
  const handlePageSizeChange = useCallback(
    (size: number) =>
      updateSearchParams({
        size: size !== PAGINATION.DEFAULT_PAGE_SIZE ? String(size) : undefined,
        page: undefined,
      }),
    [updateSearchParams],
  )
  const handleFilterChange = useCallback(
    (key: string, value: string) =>
      updateSearchParams({ [key]: value !== 'all' ? value : undefined, page: undefined }),
    [updateSearchParams],
  )

  // Filter options: only OTMs / education types / forms that ACTUALLY occur in attachments
  // (never the full classifier), so a dropdown never offers a choice that returns zero rows.
  const { data: filterOptions } = useSpecialityAttachmentFilterOptions()
  const universities = filterOptions?.universities ?? []
  const educationTypes = filterOptions?.educationTypes ?? []
  const educationForms = filterOptions?.educationForms ?? []
  const years = filterOptions?.years ?? []

  const listParams = {
    universityCode: universityFromUrl !== 'all' ? universityFromUrl : undefined,
    educationType: eduTypeFromUrl !== 'all' ? eduTypeFromUrl : undefined,
    educationForm: eduFormFromUrl !== 'all' ? eduFormFromUrl : undefined,
    eduYear: eduYearNum,
    page: currentPage,
    size: pageSize,
  }

  const { data, isLoading, isPlaceholderData, refetch } = useSpecialityAttachments(listParams)

  const rows = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0
  const loading = isLoading && !isPlaceholderData
  const hasFilters =
    universityFromUrl !== 'all' ||
    eduTypeFromUrl !== 'all' ||
    eduFormFromUrl !== 'all' ||
    eduYearFromUrl !== 'all'

  const handleRefresh = useCallback(() => {
    refetch()
    toast.success(t('Data refreshed'))
  }, [refetch, t])

  const handleExport = async (mode: 'all' | 'view') => {
    setExporting(true)
    try {
      const blob = await specialityAttachmentsApi.exportXlsx(
        mode === 'view'
          ? {
              universityCode: universityFromUrl !== 'all' ? universityFromUrl : undefined,
              educationType: eduTypeFromUrl !== 'all' ? eduTypeFromUrl : undefined,
              educationForm: eduFormFromUrl !== 'all' ? eduFormFromUrl : undefined,
              eduYear: eduYearNum,
            }
          : {},
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const scopeSuffix = mode === 'view' ? '_filtrlangan' : ''
      const dateSuffix = `_${new Date().toISOString().slice(0, 10)}`
      a.download = `biriktirilgan_mutaxassisliklar${scopeSuffix}${dateSuffix}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(t('Export completed'))
    } catch {
      toast.error(t('Export failed'))
    } finally {
      setExporting(false)
    }
  }

  // Taxonomy level label (Yo'nalish / Ichki yo'nalish) — reuses the classifier's level-key map.
  const levelLabel = (level?: number | null) => {
    const key = specialityLevelKey(level)
    return key ? t(key) : '-'
  }

  return (
    <div className="space-y-3 p-4">
      <div className="rounded-md border border-[var(--border-color-pro)] bg-[var(--card-bg)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color-pro)] px-4 py-2.5">
          {/* University filter — searchable by code OR name (~98 OTMs). Trigger shows the filter
              name ("Universitet") until an OTM is picked; "Barchasi" at the top clears it. */}
          <SearchableSelect
            value={universityFromUrl}
            onChange={(v) => handleFilterChange('universityCode', v)}
            options={universities}
            placeholder={t('University')}
            allLabel={t('All')}
            searchPlaceholder={t('Search')}
            emptyLabel={t('No data found')}
            className="w-[340px]"
          />

          {/* Education type filter (Bakalavr / Magistr) */}
          <Select
            value={eduTypeFromUrl}
            onValueChange={(v) => handleFilterChange('educationType', v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('Education type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('Education type')}</SelectItem>
              {educationTypes.map((e) => (
                <SelectItem key={e.code} value={e.code}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Education form filter (Kunduzgi / Kechki / Masofaviy) */}
          <Select
            value={eduFormFromUrl}
            onValueChange={(v) => handleFilterChange('educationForm', v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('Education form')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('Education form')}</SelectItem>
              {educationForms.map((e) => (
                <SelectItem key={e.code} value={e.code}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Academic-year filter — options come from the data (grows as future years are seeded),
              newest first; label is the span (2026-2027), value is the start year. */}
          <Select value={eduYearFromUrl} onValueChange={(v) => handleFilterChange('eduYear', v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('Education year')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('Education year')}</SelectItem>
              {years.map((y) => (
                <SelectItem key={y.code} value={y.code}>
                  {y.name}
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

          {/* Refresh — icon-only, compact (mirrors the /institutions/universities toolbar) */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            title={t('Refresh')}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export (whole / current view) — emerald "Eksport", matches /institutions/universities */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-3 py-1.5 text-sm font-medium text-[var(--emerald-text)] transition-colors hover:opacity-80 disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                {t('Export')}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('Export')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('all')}>{t('All')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('view')}>
                {t('Current view')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assign — attach a speciality to an OTM (primary action, rightmost). Blue-soft styling
              mirrors the /institutions/universities "Add" button. */}
          {canCreate && (
            <>
              <div className="h-5 w-px bg-[var(--border-color-pro)]" />
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
              >
                <Plus className="h-4 w-4" />
                {t('Attach')}
              </button>
            </>
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
                  {t('University')}
                </th>
                <th className="w-32 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('Code')}
                </th>
                <th className="bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('Speciality')}
                </th>
                <th className="w-36 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('Type')}
                </th>
                <th className="w-40 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('Education type')}
                </th>
                <th className="w-40 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('Education form')}
                </th>
                <th className="w-24 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('Education year')}
                </th>
                <th className="w-24 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('Status')}
                </th>
                {hasActions && (
                  <th className="w-24 bg-[var(--table-header-bg)] px-3 py-2.5 text-right text-sm font-medium text-[var(--text-secondary)]">
                    {t('Actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr
                    key={`skeleton-${i}`}
                    className={i % 2 === 1 ? 'bg-[var(--table-row-alt)]' : ''}
                  >
                    {Array.from({ length: colCount }).map((__, j) => (
                      <td key={j} className="px-3 py-2">
                        <Skeleton className="h-4 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <GraduationCap className="h-8 w-8 text-[var(--text-secondary)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {t('No data found')}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                          {hasFilters
                            ? t('Try changing your search or filters')
                            : t('No data found')}
                        </p>
                      </div>
                      {hasFilters && (
                        <button
                          onClick={() =>
                            updateSearchParams({
                              universityCode: undefined,
                              educationType: undefined,
                              educationForm: undefined,
                              eduYear: undefined,
                              page: undefined,
                            })
                          }
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
                    <td className="px-3 py-2 text-sm">
                      <div className="font-medium text-[var(--text-primary)]">
                        {row.universityName || row.universityCode}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] tabular-nums">
                        {row.universityCode}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--text-secondary)] tabular-nums">
                      {row.specialityCode || '-'}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="text-[var(--text-primary)]">{row.specialityName || '-'}</div>
                      {row.parentName ? (
                        <div className="text-xs text-[var(--text-secondary)]">
                          ↳{' '}
                          {row.parentCode ? (
                            <span className="tabular-nums">{row.parentCode}</span>
                          ) : null}
                          {row.parentCode ? ' · ' : ''}
                          {row.parentName}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                      {levelLabel(row.hierarchyLevel)}
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                      {row.educationTypeName || row.educationType || '-'}
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                      {row.educationFormName || row.educationForm || '-'}
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--text-secondary)] tabular-nums">
                      {row.eduYear ? `${row.eduYear}-${row.eduYear + 1}` : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={row.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {t(STATUS_LABEL[row.status] ?? row.status)}
                      </Badge>
                    </td>
                    {hasActions && (
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t('Edit')}
                              onClick={() => setEditTarget(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t('Delete')}
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDeleteTarget(row)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
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

      {/* Assign (create) dialog */}
      <SpecialityAttachmentCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Edit dialog */}
      <SpecialityAttachmentEditDialog
        row={editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      />

      {/* Detach (delete) confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.universityName || deleteTarget.universityCode} — ${
                    deleteTarget.specialityName || deleteTarget.specialityCode || ''
                  }`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget)
                  deleteMutation.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  })
              }}
            >
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
