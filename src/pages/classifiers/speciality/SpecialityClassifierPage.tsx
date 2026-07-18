import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, RefreshCw, List, FolderTree, GraduationCap, Loader2 } from 'lucide-react'
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

  const levelBadge = (lvl: EducationLevel) =>
    lvl === 'BACHELOR' ? (
      <Badge variant="default">{t('Bachelor')}</Badge>
    ) : (
      <Badge variant="secondary">{t('Master')}</Badge>
    )

  const statusBadge = (s: ReviewStatus) =>
    s === 'NEEDS_REVIEW' ? (
      <Badge variant="outline" className="border-[#F2C94C] bg-[#FEF7E0] text-[#B7791F]">
        {t('Needs review')}
      </Badge>
    ) : (
      <Badge variant="outline" className="border-[#27AE60] bg-[#E9F9EF] text-[#1E8449]">
        {t('Approved')}
      </Badge>
    )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="text-primary h-7 w-7" />
          <div>
            <h1 className="font-display text-2xl">{t('Speciality classifier')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('Unified bachelor and master speciality classifier')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            listQuery.refetch()
            treeQuery.refetch()
          }}
        >
          <RefreshCw className="h-4 w-4" />
          {t('Refresh')}
        </Button>
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
        ) : null}
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
                      <TableCell className="font-mono text-xs text-[#6B7280]">
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
          ) : (
            <SpecialityTree nodes={treeQuery.data} onSelect={setSelectedId} />
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
