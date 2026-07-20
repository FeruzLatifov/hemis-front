import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search,
  List,
  FolderTree,
  GraduationCap,
  Loader2,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useSpecialityList, useSpecialityTree } from '@/hooks/useSpeciality'
import type { EducationLevel, ReviewStatus } from '@/api/speciality.api'
import { UI } from '@/constants'
import { SpecialityTree } from './SpecialityTree'
import SpecialityDetailDrawer from './SpecialityDetailDrawer'
import {
  sortSpecialityNodes,
  filterSpecialityNodes,
  collectExpandableIds,
} from './speciality-tree.util'

type ViewMode = 'list' | 'tree'
type StatusFilter = 'all' | ReviewStatus

export default function SpecialityClassifierPage() {
  const { t } = useTranslation()
  const { can } = usePermission()
  const canEdit = can('classifiers.speciality.edit')

  const [searchParams, setSearchParams] = useSearchParams()
  const level = (searchParams.get('level') as EducationLevel) || 'BACHELOR'
  const view = (searchParams.get('view') as ViewMode) || 'list'
  const status = (searchParams.get('status') as StatusFilter) || 'all'
  const qFromUrl = (searchParams.get('q') || '').slice(0, 200)
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0)
  const size = Math.max(1, Math.min(100, parseInt(searchParams.get('size') || '20', 10) || 20))

  const [searchInput, setSearchInput] = useState(qFromUrl)
  const debouncedSearch = useDebounce(searchInput, UI.SEARCH_DEBOUNCE)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

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

  const listQuery = useSpecialityList({
    educationLevel: level,
    reviewStatus,
    q: debouncedSearch || undefined,
    page,
    size,
  })
  const treeQuery = useSpecialityTree(level, view === 'tree')

  const total = listQuery.data?.totalElements ?? 0
  const totalPages = listQuery.data?.totalPages ?? 0

  // Backend returns tree nodes in string order — sort to the canonical
  // year-desc → numeric-code order, then filter client-side for tree search.
  const sortedTree = useMemo(() => sortSpecialityNodes(treeQuery.data ?? []), [treeQuery.data])
  const searching = debouncedSearch.trim().length > 0
  const treeNodes = useMemo(
    () => filterSpecialityNodes(sortedTree, debouncedSearch),
    [sortedTree, debouncedSearch],
  )
  // While searching, force every matched branch open so hits stay visible.
  const effectiveOpen = useMemo(
    () => (searching ? new Set(collectExpandableIds(treeNodes)) : openIds),
    [searching, treeNodes, openIds],
  )

  const toggleNode = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const expandAll = () => setOpenIds(new Set(collectExpandableIds(sortedTree)))
  const collapseAll = () => setOpenIds(new Set())

  const levelBadge = (lvl: EducationLevel) =>
    lvl === 'BACHELOR' ? (
      <Badge variant="default">{t('Bachelor')}</Badge>
    ) : (
      <Badge variant="secondary">{t('Master')}</Badge>
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
      <div className="flex items-center gap-3">
        <GraduationCap className="text-primary h-6 w-6" />
        <div>
          <h1 className="font-display text-lg">{t('Speciality classifier')}</h1>
          <p className="text-muted-foreground text-sm">
            {t('Unified bachelor and master speciality classifier')}
          </p>
        </div>
      </div>

      {/* Level tabs */}
      <Tabs value={level} onValueChange={(v) => setParams({ level: v, page: undefined })}>
        <TabsList>
          <TabsTrigger value="BACHELOR">{t('Bachelor')}</TabsTrigger>
          <TabsTrigger value="MASTER">{t('Master')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center rounded-md border p-0.5">
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setParams({ view: 'list' })}
          >
            <List className="h-4 w-4" />
            {t('List')}
          </Button>
          <Button
            variant={view === 'tree' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setParams({ view: 'tree' })}
          >
            <FolderTree className="h-4 w-4" />
            {t('Tree')}
          </Button>
        </div>

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

        <div className="relative min-w-[240px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setParams({ q: e.target.value || undefined, page: undefined })
            }}
            placeholder={t('Search by name or code')}
            className="pl-9"
          />
        </div>

        {view === 'list' ? (
          <span className="text-muted-foreground text-sm">
            {t('{{count}} found', { count: total })}
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={expandAll} disabled={searching}>
              <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
              {t('Expand all')}
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll} disabled={searching}>
              <ChevronsDownUp className="h-4 w-4" aria-hidden="true" />
              {t('Collapse all')}
            </Button>
          </div>
        )}
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
                    <TableHead className="w-28">{t('Level')}</TableHead>
                    <TableHead className="w-36">{t('Status')}</TableHead>
                    <TableHead className="w-40">{t('Years')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.data?.content.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(row.id)}
                    >
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {row.code ?? '-'}
                      </TableCell>
                      <TableCell className="max-w-md truncate">{row.nameUz}</TableCell>
                      <TableCell>{levelBadge(row.educationLevel)}</TableCell>
                      <TableCell>{statusBadge(row.reviewStatus)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.years && row.years.length > 0 ? row.years.join(', ') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
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
            <div className="text-muted-foreground flex items-center justify-center gap-2 p-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('Loading...')}
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
              openIds={effectiveOpen}
              onToggle={toggleNode}
              onSelect={setSelectedId}
              query={searching ? debouncedSearch : undefined}
            />
          )}
        </Card>
      )}

      {selectedId ? (
        <SpecialityDetailDrawer
          specialityId={selectedId}
          canEdit={canEdit}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  )
}
