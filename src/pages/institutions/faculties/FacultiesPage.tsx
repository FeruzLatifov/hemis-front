/**
 * Faculty Registry Page - Main Component
 *
 * Features:
 * - Lazy-loaded tree structure (University → Faculties)
 * - Server-side pagination
 * - Search and filter
 * - Excel export
 * - Column visibility toggle
 * - i18n support (uz-UZ, oz-UZ, ru-RU, en-US)
 */

import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useTranslation } from 'react-i18next'
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { ChevronRight, ChevronDown, Download, RefreshCw, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { facultiesApi, FacultyGroupRow, FacultyRow, PageResponse } from '@/api/faculties.api'
import { extractApiErrorMessage } from '@/utils/error.util'
import FacultyDetailDrawer from './FacultyDetailDrawer'

type TableRow = {
  type: 'group' | 'faculty'
  data: FacultyGroupRow | FacultyRow
  isExpanded?: boolean
  subRows?: TableRow[]
}

export default function FacultiesPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedFacultyCode, setSelectedFacultyCode] = useState<string | null>(null)

  // Fetch university groups
  const {
    data: groupsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.faculties.groups({ search, status, page }),
    queryFn: () =>
      facultiesApi.getGroups({
        q: search || undefined,
        status: status === 'all' ? undefined : status === 'true',
        page,
        size: 20,
      }),
  })

  // Fetch faculties for expanded universities
  const expandedUniversities = Object.keys(expanded).filter((key) => expanded[key])
  const facultyPages: Record<string, number> = {}

  const facultyQueries = useQuery({
    queryKey: queryKeys.faculties.byUniversity(expandedUniversities, {
      facultyPages,
      search,
      status,
    }),
    queryFn: async () => {
      const results: Record<string, PageResponse<FacultyRow>> = {}
      await Promise.all(
        expandedUniversities.map(async (univCode) => {
          const facultyPage = facultyPages[univCode] || 0
          results[univCode] = await facultiesApi.getFacultiesByUniversity(univCode, {
            q: search || undefined,
            status: status === 'all' ? undefined : status === 'true',
            page: facultyPage,
            size: 50,
          })
        }),
      )
      return results
    },
    enabled: expandedUniversities.length > 0,
  })

  // Auto-expand all groups when searching to fetch child faculties by query
  useEffect(() => {
    if (!groupsData?.content) return
    const hasSearch = (search || '').trim().length > 0
    if (hasSearch) {
      const allExpanded: Record<string, boolean> = {}
      for (const g of groupsData.content) {
        allExpanded[g.universityCode] = true
      }
      setExpanded(allExpanded)
    }
  }, [groupsData, search, setExpanded])

  const columns: ColumnDef<TableRow>[] = [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => {
        if (row.original.type === 'faculty') return null
        const isExpanded = expanded[row.original.data.universityCode]
        return (
          <button
            onClick={() => {
              const code = row.original.data.universityCode
              setExpanded((prev) => ({ ...prev, [code]: !prev[code] }))
            }}
            className="p-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )
      },
      size: 40,
    },
    {
      accessorKey: 'name',
      header: t('University name'),
      cell: ({ row }) => {
        const data = row.original.data
        if (row.original.type === 'group') {
          return <div className="font-medium">{(data as FacultyGroupRow).universityName}</div>
        } else {
          return <div className="ml-6 text-sm">{(data as FacultyRow).nameUz}</div>
        }
      },
    },
    {
      accessorKey: 'code',
      header: t('Code'),
      cell: ({ row }) => {
        const data = row.original.data
        return row.original.type === 'group'
          ? (data as FacultyGroupRow).universityCode
          : (data as FacultyRow).code
      },
    },
    {
      accessorKey: 'count',
      header: t('Faculty count'),
      cell: ({ row }) => {
        if (row.original.type === 'group') {
          const data = row.original.data as FacultyGroupRow
          return (
            <div className="text-sm">
              <span className="font-medium">{data.facultyCount}</span>
              <span className="text-muted-foreground ml-1">
                ({t('Active')}: {data.activeFacultyCount} / {t('Inactive')}:{' '}
                {data.inactiveFacultyCount})
              </span>
            </div>
          )
        }
        return null
      },
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => {
        if (row.original.type === 'faculty') {
          const data = row.original.data as FacultyRow
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                data.status ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
              }`}
            >
              {data.status ? t('Active') : t('Inactive')}
            </span>
          )
        }
        return null
      },
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => {
        if (row.original.type === 'faculty') {
          const data = row.original.data as FacultyRow
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFacultyCode(data.code)
              }}
            >
              <Eye className="mr-1 h-4 w-4" />
              {t('View')}
            </Button>
          )
        }
        return null
      },
      size: 100,
    },
  ]

  // Prepare table data
  const tableData: TableRow[] = React.useMemo(() => {
    if (!groupsData?.content) return []

    return groupsData.content
      .map((group) => {
        const row: TableRow = {
          type: 'group',
          data: group,
          subRows: [],
        }

        // Add faculty children if expanded
        if (expanded[group.universityCode] && facultyQueries.data?.[group.universityCode]) {
          const facultiesData = facultyQueries.data[group.universityCode]
          row.subRows = facultiesData.content.map((faculty: FacultyRow) => ({
            type: 'faculty' as const,
            data: faculty,
          }))
        }

        // When searching, show only groups that have matching child faculties
        const hasSearch = (search || '').trim().length > 0
        if (hasSearch && (row.subRows?.length || 0) === 0) {
          return null
        }

        return row
      })
      .filter((row): row is TableRow => row !== null)
  }, [groupsData, expanded, facultyQueries.data, search])

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const handleExport = async () => {
    try {
      const blob = await facultiesApi.exportFaculties({
        q: search || undefined,
        status: status === 'all' ? undefined : status === 'true',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `faculties_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(t('Download Excel'), {
        duration: 3000,
        position: 'bottom-right',
      })
    } catch (error) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      toast.error(extractApiErrorMessage(error, t('Export failed')), {
        duration: 5000,
        position: 'bottom-right',
      })
    }
  }

  return (
    <>
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('Faculties')}</h1>
            <p className="text-muted-foreground">{t('Filters')}</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder={t('Search...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="max-w-sm"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Status')}</SelectItem>
                <SelectItem value="true">{t('Active')}</SelectItem>
                <SelectItem value="false">{t('Inactive')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('Refresh')}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              {t('Export')}
            </Button>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left text-sm font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={columns.length} className="px-4 py-3">
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-red-500">
                      {t('Failed to load data')}:{' '}
                      {error instanceof Error ? error.message : 'Unknown error'}
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-muted-foreground px-4 py-8 text-center"
                    >
                      {t('No data found')}
                    </td>
                  </tr>
                ) : (
                  <>
                    {table.getRowModel().rows.map((row) => (
                      <React.Fragment key={row.id}>
                        <tr className="hover:bg-muted/50 border-b">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                        {/* Render sub-rows (faculties) */}
                        {row.original.subRows?.map((subRow, idx) => (
                          <tr key={`${row.id}-sub-${idx}`} className="hover:bg-muted/50 border-b">
                            {columns.map((column, colIdx) => (
                              <td key={colIdx} className="px-4 py-2">
                                {column.cell && typeof column.cell === 'function'
                                  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    flexRender(column.cell, { row: { original: subRow } } as any)
                                  : null}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {groupsData && groupsData.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <div className="text-muted-foreground text-sm">
                {t('of')} {groupsData.totalElements} {t('Rows per page')}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  {t('Previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= groupsData.totalPages - 1}
                >
                  {t('Next')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Faculty Detail Drawer */}
      {selectedFacultyCode && (
        <FacultyDetailDrawer
          facultyCode={selectedFacultyCode}
          onClose={() => setSelectedFacultyCode(null)}
        />
      )}
    </>
  )
}
