import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Download, Loader2, Plus, Trash2, Pencil } from 'lucide-react'
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
import { DataTableToolbar, type DataTableToolbarChip } from '@/components/tables/DataTableToolbar'
import { PAGINATION, UI } from '@/constants'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'
import { usePermission } from '@/hooks/usePermission'
import {
  useSpecialityAttachments,
  useSpecialityAttachmentFilterOptions,
  useDeleteSpecialityAttachment,
  useEducationForms,
} from '@/hooks/useSpecialityAttachments'
import { specialityAttachmentsApi, classifierLabel } from '@/api/specialityAttachments.api'
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
  const { t, i18n } = useTranslation()
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
  // Columns: № + University + Code + Speciality + Education + Year + Status (+ Actions).
  const colCount = hasActions ? 8 : 7

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
  const statusFromUrl = searchParams.get('status') || 'all'
  const qFromUrl = (searchParams.get('q') || '').slice(0, 200)
  // Deep-link filter: the classifier's delete dialog links here with ?specialityId=<uuid> so the
  // admin lands on exactly the attachments that block the delete.
  const specialityIdFromUrl = searchParams.get('specialityId') || undefined
  // Numeric year for the API — guards a hand-tampered ?eduYear=abc from sending NaN (→ 400).
  const eduYearNum =
    eduYearFromUrl !== 'all' && Number.isFinite(Number(eduYearFromUrl))
      ? Number(eduYearFromUrl)
      : undefined
  const [searchInput, setSearchInput] = useState(qFromUrl)
  const debouncedSearch = useDebounce(searchInput, UI.SEARCH_DEBOUNCE)

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
  // Memoised so the chip list below keeps a stable identity between renders.
  const universities = useMemo(() => filterOptions?.universities ?? [], [filterOptions])
  const educationTypes = useMemo(() => filterOptions?.educationTypes ?? [], [filterOptions])
  const years = useMemo(() => filterOptions?.years ?? [], [filterOptions])
  // Education-form filter shows only the forms that ACTUALLY occur in attachments (like the
  // University / Education-type / Education-year filters) — a filter never offers a zero-result
  // choice. The label is taken from the h_education_form classifier (multilingual name/nameRu/
  // nameEn) when available, falling back to the backend's uz name. (The create/edit picker keeps
  // the FULL classifier — any form is attachable; only the FILTER is narrowed to present forms.)
  const { data: educationFormClassifier = [] } = useEducationForms()
  const formLabelByCode = useMemo(
    () => new Map(educationFormClassifier.map((f) => [f.code, classifierLabel(f, i18n.language)])),
    [educationFormClassifier, i18n.language],
  )
  const educationForms = useMemo(
    () =>
      (filterOptions?.educationForms ?? []).map((o) => ({
        code: o.code,
        name: formLabelByCode.get(o.code) ?? o.name,
      })),
    [filterOptions, formLabelByCode],
  )

  const listParams = {
    universityCode: universityFromUrl !== 'all' ? universityFromUrl : undefined,
    specialityId: specialityIdFromUrl,
    q: debouncedSearch.trim() || undefined,
    educationType: eduTypeFromUrl !== 'all' ? eduTypeFromUrl : undefined,
    educationForm: eduFormFromUrl !== 'all' ? eduFormFromUrl : undefined,
    eduYear: eduYearNum,
    status: statusFromUrl !== 'all' ? statusFromUrl : undefined,
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
    eduYearFromUrl !== 'all' ||
    statusFromUrl !== 'all' ||
    qFromUrl.trim() !== '' ||
    specialityIdFromUrl !== undefined

  const handleClearFilters = useCallback(() => {
    setSearchInput('')
    updateSearchParams({
      universityCode: undefined,
      specialityId: undefined,
      q: undefined,
      educationType: undefined,
      educationForm: undefined,
      eduYear: undefined,
      status: undefined,
      page: undefined,
    })
  }, [updateSearchParams])

  // The ?specialityId= filter has no dropdown of its own, so without a visible marker a narrowed
  // table reads as "empty/broken". Show it as a removable chip instead; the value comes from the
  // first row (every row in scope shares the speciality) and falls back to the raw id while the
  // page is still empty.
  const specialityChipValue = specialityIdFromUrl
    ? [rows[0]?.specialityCode, rows[0]?.specialityName].filter(Boolean).join(' — ') ||
      specialityIdFromUrl
    : null

  // A chip ONLY for a filter with no control of its own — currently just specialityId, which
  // arrives by URL from the classifier's delete dialog. Every other filter has an open dropdown
  // on the second row already showing its value, so a chip would repeat what sits next to it.
  // A filter left at "all" shows its own name, and that name must read as a PLACEHOLDER, not as a
  // chosen value — otherwise "Ta'lim turi" (nothing picked) looks exactly like "Bakalavr" (picked).
  // SearchableSelect already dims its placeholder; Radix Select renders the "all" item as a normal
  // value, so the trigger is dimmed by hand to match.
  const filterTone = (value: string) => (value === 'all' ? 'text-[var(--text-secondary)]' : '')

  const chips = useMemo<DataTableToolbarChip[]>(() => {
    if (!specialityChipValue) return []
    return [
      {
        key: 'specialityId',
        label: t('Speciality'),
        value: specialityChipValue,
        onRemove: () => handleFilterChange('specialityId', 'all'),
      },
    ]
  }, [handleFilterChange, t, specialityChipValue])

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
              specialityId: specialityIdFromUrl,
              q: debouncedSearch.trim() || undefined,
              educationType: eduTypeFromUrl !== 'all' ? eduTypeFromUrl : undefined,
              educationForm: eduFormFromUrl !== 'all' ? eduFormFromUrl : undefined,
              eduYear: eduYearNum,
              status: statusFromUrl !== 'all' ? statusFromUrl : undefined,
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
        {/* Toolbar — search + filter popover + refresh + page actions on one line */}
        <DataTableToolbar
          leadingFilter={
            /* University leads the toolbar: with ~98 OTMs and 8k+ rows this is the filter almost
               every visit starts from, so it costs no click. Searchable by code OR name. */
            <SearchableSelect
              value={universityFromUrl}
              onChange={(v) => handleFilterChange('universityCode', v)}
              options={universities}
              placeholder={t('University')}
              allLabel={t('University')}
              searchPlaceholder={t('Search')}
              emptyLabel={t('No data found')}
              className="w-[210px]"
            />
          }
          search={{
            value: searchInput,
            onChange: (v) => {
              setSearchInput(v)
              updateSearchParams({ q: v || undefined, page: undefined })
            },
            placeholder: t('Search by name, code or UUID'),
          }}
          filters={
            <>
              {/* Education type filter (Bakalavr / Magistr) */}
              <div className="w-[180px]">
                <Select
                  value={eduTypeFromUrl}
                  onValueChange={(v) => handleFilterChange('educationType', v)}
                >
                  <SelectTrigger className={`w-full ${filterTone(eduTypeFromUrl)}`}>
                    <SelectValue placeholder={t('Education type')} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* The "no filter" option carries the filter's NAME, not "Barchasi": with no
                        label above the control, that name is the only thing telling the user what
                        this dropdown filters — same as the University select on the row above. */}
                    <SelectItem value="all">{t('Education type')}</SelectItem>
                    {educationTypes.map((e) => (
                      <SelectItem key={e.code} value={e.code}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Education form filter — short list (present forms), so no search box */}
              <div className="w-[180px]">
                <SearchableSelect
                  value={eduFormFromUrl}
                  onChange={(v) => handleFilterChange('educationForm', v)}
                  options={educationForms}
                  placeholder={t('Education form')}
                  allLabel={t('Education form')}
                  searchPlaceholder={t('Search')}
                  emptyLabel={t('No data found')}
                  className="w-full"
                  searchable={false}
                />
              </div>

              {/* Academic-year filter — options come from the data (grows as future years are
                  seeded), newest first; label is the span (2026-2027), value is the start year. */}
              <div className="w-[180px]">
                <Select
                  value={eduYearFromUrl}
                  onValueChange={(v) => handleFilterChange('eduYear', v)}
                >
                  <SelectTrigger className={`w-full ${filterTone(eduYearFromUrl)}`}>
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
              </div>

              {/* Status filter (Faol / Nofaol) — ACTIVE vs. SUSPENDED (a fixed 2-state set,
                  mirroring the edit dialog: any non-ACTIVE row is "Nofaol"). A fixed set, not
                  present-in-data, so "Nofaol" stays selectable to surface deactivated
                  attachments even when there are none. */}
              <div className="w-[180px]">
                <Select
                  value={statusFromUrl}
                  onValueChange={(v) => handleFilterChange('status', v)}
                >
                  <SelectTrigger className={`w-full ${filterTone(statusFromUrl)}`}>
                    <SelectValue placeholder={t('Status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('Status')}</SelectItem>
                    <SelectItem value="ACTIVE">{t('Active')}</SelectItem>
                    <SelectItem value="SUSPENDED">{t('Inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          }
          chips={chips}
          // "Tozalash" only when there is something to clear — with five open dropdowns and a
          // search box, clearing them one by one is the tedious case it exists for.
          onClearAll={hasFilters ? handleClearFilters : undefined}
          total={totalElements}
          onRefresh={handleRefresh}
          refreshing={isLoading}
          actions={
            <>
              {/* Export (whole / current view) — emerald "Eksport" */}
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
                  <DropdownMenuItem onClick={() => handleExport('all')}>
                    {t('All')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('view')}>
                    {t('Current view')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Attach — primary action */}
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                  <Plus className="h-4 w-4" />
                  {t('Attach')}
                </button>
              )}
            </>
          }
        />

        {(isLoading || isPlaceholderData) && (
          <div className="progress-indeterminate h-0.5 w-full" />
        )}

        {/* Table — fills the (now full-width) container on large screens; keeps a sane min-width
            so columns never crush on small screens (the wrapper scrolls horizontally instead). */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[var(--border-color-pro)]">
                <th className="w-12 bg-[var(--table-header-bg)] px-3 py-2.5 text-right text-sm font-medium text-[var(--text-secondary)]">
                  №
                </th>
                <th className="bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('University')}
                </th>
                <th className="w-36 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('Code')}
                </th>
                <th className="bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('Speciality')}
                </th>
                <th className="w-44 bg-[var(--table-header-bg)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                  {t('Education')}
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
                          onClick={handleClearFilters}
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
                    <td className="px-3 py-2 text-right text-sm text-[var(--text-secondary)] tabular-nums">
                      {currentPage * pageSize + idx + 1}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="font-medium text-[var(--text-primary)]">
                        {row.universityName || row.universityCode}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] tabular-nums">
                        {row.universityCode}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="text-[var(--text-secondary)] tabular-nums">
                        {row.specialityCode || '-'}
                      </div>
                      {row.hierarchyLevel != null ? (
                        <div className="text-xs text-[var(--text-secondary)]">
                          {levelLabel(row.hierarchyLevel)}
                        </div>
                      ) : null}
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
                    <td className="px-3 py-2 text-sm">
                      <div className="text-[var(--text-primary)]">
                        {row.educationTypeName || row.educationType || '-'}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {row.educationFormName || row.educationForm || '-'}
                      </div>
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
