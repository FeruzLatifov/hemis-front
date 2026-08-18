import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search,
  List,
  FolderTree,
  GraduationCap,
  Loader2,
  Download,
  Eye,
  Plus,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/clipboard'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { usePermission } from '@/hooks/usePermission'
import {
  useSpecialityList,
  useSpecialityTree,
  useSpecialityYears,
  useSpecialityEducationTypes,
} from '@/hooks/useSpeciality'
import {
  specialityApi,
  classifierLabel,
  type EducationTypeCode,
  type ReviewStatus,
  type SpecialityNode,
} from '@/api/speciality.api'
import { shortToBcp47 } from '@/i18n/config'
import { UI } from '@/constants'
import { SpecialityTree } from './SpecialityTree'
import { SpecialityDetailDialog } from './SpecialityDetailDialog'
import { SpecialityCreateDialog } from './SpecialityCreateDialog'
import { SpecialityEditDialog } from './SpecialityEditDialog'
import {
  sortSpecialityNodes,
  filterSpecialityNodes,
  filterSpecialityNodesByYear,
  filterSpecialityNodesByStatus,
  collectExpandableIds,
  findNodePath,
  specialityLevelKey,
} from './speciality-tree.util'

type ViewMode = 'list' | 'tree'
type StatusFilter = 'all' | ReviewStatus

export default function SpecialityClassifierPage() {
  const { t, i18n } = useTranslation()
  const { can } = usePermission()
  const canEdit = can('classifiers.speciality.edit')
  // Manual "add" is a dedicated, ministry-only permission (not the reused .edit, which
  // machine roles like OTM_API hold) — gates the create button + form.
  const canCreate = can('classifiers.speciality.create')
  // Promoting NEEDS_REVIEW → APPROVED (triggers OTM distribution) is a separate ministry-only
  // capability — gates the "Approved" option in the edit modal (the backend also enforces it).
  const canApprove = can('classifiers.speciality.approve')

  const [searchParams, setSearchParams] = useSearchParams()
  // Education type: a code — '11'=Bakalavr, '12'=Magistr (URL ?educationType=). Selected via the
  // toolbar "Ta'lim turi" dropdown (was a tab bar). Options + labels come from the classifier table.
  const level = (searchParams.get('educationType') as EducationTypeCode) || '11'
  const { data: eduTypeOptions = [] } = useSpecialityEducationTypes()
  const selectedEduType = eduTypeOptions.find((o) => o.code === level)
  // Tree is the default landing view — the classifier reads far more naturally as a hierarchy
  // than a flat grid, so first entry (no ?view=) opens the tree.
  const view = (searchParams.get('view') as ViewMode) || 'tree'
  const status = (searchParams.get('status') as StatusFilter) || 'all'
  const yearParam = searchParams.get('year') || 'all'
  const qFromUrl = (searchParams.get('q') || '').slice(0, 200)
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0)
  const size = Math.max(1, Math.min(100, parseInt(searchParams.get('size') || '20', 10) || 20))

  const [searchInput, setSearchInput] = useState(qFromUrl)
  const debouncedSearch = useDebounce(searchInput, UI.SEARCH_DEBOUNCE)
  // Selected speciality — row highlight in both views, plus keyboard navigation
  // in the tree. Selection alone never opens the modal.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Id whose detail modal is open — shared by both views, kept separate from
  // selectedId so navigating/selecting a row never pops the dialog on its own.
  const [detailId, setDetailId] = useState<string | null>(null)
  // Id whose dedicated edit form is open. Opening it closes the detail modal (never stacked).
  const [editId, setEditId] = useState<string | null>(null)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  // "Add speciality" modal — pre-fills the parent from the highlighted row (selectedId).
  const [createOpen, setCreateOpen] = useState(false)

  const setParams = (updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  const reviewStatus: ReviewStatus | undefined = status === 'all' ? undefined : status
  const parsedYear = Number(yearParam)
  const yearFilter: number | undefined =
    yearParam === 'all' || Number.isNaN(parsedYear) ? undefined : parsedYear

  const listQuery = useSpecialityList(
    {
      educationType: level,
      reviewStatus,
      q: debouncedSearch || undefined,
      year: yearFilter,
      page,
      size,
    },
    view === 'list', // idle while the Tree view is active (the default)
  )
  // Always load the tree (even in list view): the "Jami yo'nalish" (level-3 count) is derived
  // from it, and it must show in both views. One cached query — the tree is the default view anyway.
  const treeQuery = useSpecialityTree(level, true)
  const yearsQuery = useSpecialityYears(level)

  const total = listQuery.data?.totalElements ?? 0
  const totalPages = listQuery.data?.totalPages ?? 0

  // Backend returns tree nodes in string order — sort to the canonical
  // year-desc → numeric-code order, then filter client-side for tree search.
  const sortedTree = useMemo(() => sortSpecialityNodes(treeQuery.data ?? []), [treeQuery.data])
  const searching = debouncedSearch.trim().length > 0
  // Status prune first (so "Needs review" scopes the tree, not just the list), then the year
  // prune (mirrors the backend), then the existing text filter — all three compose.
  const treeNodes = useMemo(() => {
    const byStatus = reviewStatus
      ? filterSpecialityNodesByStatus(sortedTree, reviewStatus)
      : sortedTree
    const byYear = yearFilter != null ? filterSpecialityNodesByYear(byStatus, yearFilter) : byStatus
    return filterSpecialityNodes(byYear, debouncedSearch)
  }, [sortedTree, reviewStatus, debouncedSearch, yearFilter])

  // "Jami yo'nalish" — number of level-3 (Yo'nalish) nodes in scope, honoring the year + status
  // filters (a node counts if its OWN years include the selected year, matching the backend, so the
  // Bakalavr 2026 count reads exactly 236). Not search-scoped: it's a summary, not a search result.
  const yonalishCount = useMemo(() => {
    let n = 0
    const walk = (nodes: SpecialityNode[]) => {
      for (const node of nodes) {
        if (node.hierarchyLevel === 3) {
          const yearOk = yearFilter == null || (node.years?.includes(yearFilter) ?? false)
          const statusOk = reviewStatus == null || node.reviewStatus === reviewStatus
          if (yearOk && statusOk) n += 1
        }
        if (node.children.length) walk(node.children)
      }
    }
    walk(sortedTree)
    return n
  }, [sortedTree, yearFilter, reviewStatus])
  // Reveal matching branches on a TEXT search OR a status filter so the hits are visible — surfacing
  // the (few) NEEDS_REVIEW rows buried in collapsed folders is the whole point of the status filter.
  // A year filter only scopes the tree and never forces the open state — there expand/collapse stays
  // under the user's control.
  useEffect(() => {
    if (searching || reviewStatus) {
      setOpenIds(new Set(collectExpandableIds(treeNodes)))
    }
  }, [searching, reviewStatus, treeNodes])
  // Root→shown chain for the detail-modal breadcrumb (client-side, no backend).
  const detailPath = useMemo(
    () => (detailId ? findNodePath(sortedTree, detailId) : []),
    [sortedTree, detailId],
  )
  // Instant header data for the modal opened from the LIST (the tree isn't loaded
  // there, so detailPath is empty) — the row is already in hand, so the dialog can
  // render the name/code/badges immediately instead of flashing a placeholder.
  const detailRow = useMemo(
    () => (detailId ? listQuery.data?.content.find((r) => r.id === detailId) : undefined),
    [detailId, listQuery.data],
  )

  const toggleNode = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Open the centered detail/edit modal — shared by tree (double-click / Ko'rish /
  // Enter) and list (double-click / Ko'rish). Selecting keeps the row highlighted.
  const openDetail = (id: string) => {
    setSelectedId(id)
    setDetailId(id)
  }

  // Export the classifier as a professional .xlsx. `mode='whole'` ⇒ the entire classifier
  // (no filters); `mode='view'` ⇒ the current grid — active year/status/search applied, so the
  // file mirrors what's on screen. `lvl` undefined ⇒ both levels as two sheets. Labels follow the
  // active UI language. The workbook is built server-side in-memory; nothing is persisted.
  const handleExport = async (mode: 'whole' | 'view', lvl?: EducationTypeCode) => {
    setExporting(true)
    try {
      // The export endpoint keys its column/label text by the backend's region locale
      // (uz-UZ / ru-RU / …), not i18next's short code (uz / ru / …). Normalize it — otherwise
      // the headers fall back to the default language and every export misses the warm i18n cache.
      const lang = shortToBcp47[i18n.language] ?? i18n.language
      const blob = await specialityApi.exportXlsx(
        mode === 'view'
          ? {
              educationType: lvl,
              year: yearFilter,
              reviewStatus,
              q: debouncedSearch.trim() || undefined,
              lang,
            }
          : { educationType: lvl, lang },
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const levelSuffix = lvl === '11' ? '_bakalavr' : lvl === '12' ? '_magistr' : ''
      const scopeSuffix = mode === 'view' ? '_filtrlangan' : ''
      const dateSuffix = `_${new Date().toISOString().slice(0, 10)}`
      a.download = `mutaxassislik_klassifikatori${levelSuffix}${scopeSuffix}${dateSuffix}.xlsx`
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

  // Show the resolved classifier name (h_education_type) when present; the code only drives the
  // badge variant. Falls back to Bachelor/Master labels for the (current) 2-type classifier.
  const levelBadge = (code: string, name?: string) =>
    code === '11' ? (
      <Badge variant="default">{name || t('Bachelor')}</Badge>
    ) : (
      <Badge variant="secondary">{name || t('Master')}</Badge>
    )

  const statusBadge = (s: ReviewStatus) =>
    s === 'NEEDS_REVIEW' ? (
      <Badge
        variant="outline"
        className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
      >
        {t('Needs review')}
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
      >
        {t('Approved')}
      </Badge>
    )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GraduationCap className="text-primary h-6 w-6" />
          <div>
            <h1 className="font-display text-lg">{t('Speciality classifier')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('Unified bachelor and master speciality classifier')}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center rounded-md border p-0.5">
          <Button
            variant={view === 'tree' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setParams({ view: 'tree' })
              setSelectedId(null)
            }}
          >
            <FolderTree className="h-4 w-4" />
            {t('Tree')}
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setParams({ view: 'list' })
              setSelectedId(null)
            }}
          >
            <List className="h-4 w-4" />
            {t('List')}
          </Button>
        </div>

        {/* Ta'lim turi — Bakalavr/Magistr selector (was a tab bar). Options + labels from the
            h_education_type classifier. Switching resets the year filter + drops the row highlight
            (a cross-type parent must not pre-fill the create form). */}
        <Select
          value={level}
          onValueChange={(v) => {
            setParams({ educationType: v, page: undefined, year: undefined })
            setSelectedId(null)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('Education type')}>
              {selectedEduType
                ? classifierLabel(selectedEduType, i18n.language)
                : level === '11'
                  ? t('Bachelor')
                  : t('Master')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {eduTypeOptions.map((o) => (
              <SelectItem key={o.code} value={o.code}>
                {classifierLabel(o, i18n.language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setParams({ status: v, page: undefined })}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All statuses')}</SelectItem>
            <SelectItem value="APPROVED">{t('Approved')}</SelectItem>
            <SelectItem value="NEEDS_REVIEW">{t('Needs review')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={yearParam}
          onValueChange={(v) => setParams({ year: v === 'all' ? undefined : v, page: undefined })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('Year')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All years')}</SelectItem>
            {(yearsQuery.data ?? []).map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative min-w-[240px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setParams({ q: e.target.value || undefined, page: undefined })
            }}
            placeholder={t('Search by name, code or UUID')}
            className="pl-9"
          />
        </div>

        {view === 'list' ? (
          <span className="text-muted-foreground text-sm">
            {t('{{count}} found', { count: total })}
          </span>
        ) : null}

        {/* Primary actions live in the toolbar, next to the filters — far less pointer travel than
            the top-right corner (Fitts's law). Export is secondary (outline); Add is the one primary CTA. */}
        <div className="ml-auto flex items-center gap-2">
          {/* Level-3 (Yo'nalish) count for the current tab + year/status filters — e.g. Bakalavr
              2026 reads 236. Shown just before Export so the user sees the scope at a glance. */}
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            {t('Total')} {t('Direction').toLowerCase()}:{' '}
            <span className="text-foreground font-semibold tabular-nums">{yonalishCount}</span>
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={exporting}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                {t('Export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>{t('Whole classifier')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('whole', level)}>
                {level === '11' ? t('Bachelor') : t('Master')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('whole', undefined)}>
                {t('Bachelor')} + {t('Master')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t('Current view')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('view', level)}>
                {level === '11' ? t('Bachelor') : t('Master')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canCreate ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('Add')}
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Content */}
      {view === 'list' ? (
        <Card className="p-0">
          {listQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : listQuery.isError ? (
            <div className="p-8 text-center text-red-600">{t('Failed to load data')}</div>
          ) : total === 0 ? (
            <div className="text-muted-foreground p-8 text-center">{t('No data')}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">{t('Code')}</TableHead>
                    <TableHead>{t('Name')}</TableHead>
                    <TableHead className="w-40">{t('Hierarchy level')}</TableHead>
                    <TableHead className="w-28">{t('Level')}</TableHead>
                    <TableHead className="w-36">{t('Status')}</TableHead>
                    <TableHead className="w-16">{t('Version')}</TableHead>
                    <TableHead className="w-24">{t('Active')}</TableHead>
                    <TableHead className="min-w-[280px]">{t('UUID')}</TableHead>
                    <TableHead className="w-40">{t('Years')}</TableHead>
                    <TableHead className="w-24 text-right">{t('Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.data?.content.map((row) => {
                    const levelKey = specialityLevelKey(row.hierarchyLevel)
                    // Single click only highlights; the detail modal opens on
                    // double-click or the explicit Ko'rish button (mirrors the tree).
                    return (
                      <TableRow
                        key={row.id}
                        data-state={selectedId === row.id ? 'selected' : undefined}
                        className="cursor-pointer select-none"
                        onClick={() => setSelectedId(row.id)}
                        onDoubleClick={() => openDetail(row.id)}
                      >
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {row.code ?? '-'}
                        </TableCell>
                        <TableCell className="max-w-md truncate" title={row.nameUz}>
                          {row.nameUz}
                        </TableCell>
                        <TableCell>
                          {levelKey ? (
                            <span className="bg-foreground/10 text-muted-foreground inline-block rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
                              {t(levelKey)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {levelBadge(row.educationType, row.educationTypeName)}
                        </TableCell>
                        <TableCell>{statusBadge(row.reviewStatus)}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          v{row.version}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                              row.active
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {row.active ? t('Active') : t('Inactive')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              void copyToClipboard(row.id).then((ok) =>
                                ok ? toast.success(t('Copied')) : toast.error(t('Copy failed')),
                              )
                            }}
                            title={row.id}
                            aria-label={`${t('Copy')} — ${row.id}`}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px]"
                          >
                            <span>{row.id}</span>
                            <Copy className="h-3 w-3 shrink-0" aria-hidden="true" />
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.years && row.years.length > 0 ? row.years.join(', ') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            type="button"
                            aria-label={`${t('View')} — ${row.nameUz}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              openDetail(row.id)
                            }}
                            className="text-primary border-primary/20 bg-primary/5 hover:bg-primary hover:text-primary-foreground hover:border-primary inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all hover:shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="whitespace-nowrap">{t('View')}</span>
                          </button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="border-t p-3">
                <DataTablePagination
                  page={page}
                  totalPages={totalPages}
                  totalElements={total}
                  pageSize={size}
                  onPageChange={(p) => setParams({ page: p > 0 ? String(p) : undefined })}
                  onPageSizeChange={(s) =>
                    setParams({ size: s === 20 ? undefined : String(s), page: undefined })
                  }
                />
              </div>
            </>
          )}
        </Card>
      ) : (
        <Card className="p-4">
          {treeQuery.isLoading ? (
            <div className="space-y-1.5" aria-label={t('Loading...')}>
              {[
                'w-3/5',
                'ml-4 w-2/5',
                'ml-4 w-1/2',
                'ml-8 w-2/5',
                'w-3/5',
                'ml-4 w-1/2',
                'ml-8 w-1/3',
                'ml-4 w-2/5',
                'w-1/2',
                'ml-4 w-1/3',
              ].map((cls, i) => (
                <Skeleton key={i} className={`h-8 ${cls}`} />
              ))}
            </div>
          ) : treeQuery.isError ? (
            <div className="p-8 text-center text-red-600">{t('Failed to load data')}</div>
          ) : !treeQuery.data || treeQuery.data.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">{t('No data')}</div>
          ) : treeNodes.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">{t('No results found')}</div>
          ) : (
            <SpecialityTree
              nodes={treeNodes}
              openIds={openIds}
              selectedId={selectedId}
              onToggle={toggleNode}
              onSelect={setSelectedId}
              onOpenDetail={openDetail}
              query={searching ? debouncedSearch : undefined}
            />
          )}
        </Card>
      )}

      {/* Centered detail/edit modal — shared by tree & list views (self-closing
          when detailId is null). In list view detailPath is [] (tree not loaded),
          so no breadcrumb shows and the dialog falls back to its own detail fetch. */}
      <SpecialityDetailDialog
        specialityId={detailId}
        canEdit={canEdit}
        path={detailPath}
        headerFallback={detailRow}
        onNavigate={setDetailId}
        onEdit={(id) => {
          // Swap the detail modal for the dedicated edit form (never two stacked dialogs).
          setDetailId(null)
          setEditId(id)
        }}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
      />

      {canEdit ? (
        <SpecialityEditDialog
          open={editId != null}
          specialityId={editId}
          canApprove={canApprove}
          onOpenChange={(open) => {
            if (!open) setEditId(null)
          }}
          onSaved={(id) => {
            // Re-show the record so the admin sees the saved values (the update hook already
            // invalidated the tree/list/detail queries, so the reopened detail is fresh).
            setEditId(null)
            setSelectedId(id)
            setDetailId(id)
          }}
        />
      ) : null}

      {canCreate ? (
        <SpecialityCreateDialog
          open={createOpen}
          educationType={level}
          parentIdDefault={selectedId}
          onOpenChange={setCreateOpen}
          onCreated={(created) => {
            // Reveal the new row wherever it landed, in either view: switch to its education level
            // (the admin may have changed it in the dialog), drop the status/year filters that would
            // hide a NEEDS_REVIEW / year-less row, and search by its code (or name) — the list then
            // filters to it and the tree auto-expands the matching branch.
            const term = created.code || created.nameUz
            setSearchInput(term)
            setParams({
              educationType: created.educationType,
              status: undefined,
              year: undefined,
              q: term,
              page: undefined,
            })
            // Select the new row's PARENT (not the row itself), so the next "Add" defaults to a
            // SIBLING of what was just added — never a child of it (which would silently nest each
            // new row under the previous one). The search above still reveals the new row; a
            // top-level create (no parent) clears the selection → next add is top-level.
            setSelectedId(created.parentId ?? null)
          }}
        />
      ) : null}
    </div>
  )
}
