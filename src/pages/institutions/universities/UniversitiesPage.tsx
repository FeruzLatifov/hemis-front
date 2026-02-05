import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { universitiesApi, UniversityRow } from '@/api/universities.api'
import { useUniversityDictionaries, useDeleteUniversity } from '@/hooks/useUniversities'
import { queryKeys } from '@/lib/queryKeys'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/utils/error.util'
import {
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilterX,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react'
import UniversityDetailDrawer from './UniversityDetailDrawer'
import UniversityFormDialog from './UniversityFormDialog'
import { CustomTagFilter } from '@/components/filters/CustomTagFilter'
import { SearchScopeSelector } from '@/components/filters/SearchScopeSelector'
import { ColumnSettingsPopover } from '@/components/filters/ColumnSettingsPopover'
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

interface HorizontalFilter {
  key: string
  label: string
  selectedCodes: string[]
}

export default function UniversitiesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 0)
  const [pageSize, setPageSize] = useState(Number(searchParams.get('size')) || 20)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [searchInput, setSearchInput] = useState(search)
  const [searchScope, setSearchScope] = useState(searchParams.get('scope') || 'all')

  // UI State
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  // Filters
  const [horizontalFilters, setHorizontalFilters] = useState<HorizontalFilter[]>([])

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const saved = localStorage.getItem('universities-column-visibility')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Dialogs
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingUniversity, setEditingUniversity] = useState<UniversityRow | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; code: string | null }>({
    show: false,
    code: null,
  })

  // TanStack Query
  const queryClient = useQueryClient()
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page: currentPage, size: pageSize, sort: 'name,asc' }
    if (search) {
      if (searchScope === 'all') params.q = search
      else params[searchScope] = search
    }
    return params
  }, [currentPage, pageSize, search, searchScope])

  const {
    data: pagedData,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.universities.list(queryParams),
    queryFn: () =>
      universitiesApi.getUniversities(queryParams as Record<string, string | number | undefined>),
  })
  const universities = pagedData?.content ?? []
  const totalElements = pagedData?.totalElements ?? 0
  const totalPages = pagedData?.totalPages ?? 0

  const { data: dictionaries = { regions: [], ownerships: [], types: [] } } =
    useUniversityDictionaries()
  const deleteUniversityMutation = useDeleteUniversity()

  // Search scopes
  const searchScopes = [
    { value: 'all', label: t('All') },
    { value: 'code', label: t('Code') },
    { value: 'name', label: t('Name') },
    { value: 'tin', label: t('INN') },
    { value: 'address', label: t('Address') },
    { value: 'cadastre', label: t('Cadastre') },
  ]

  // Available filters
  const availableHorizontalFilters = [
    { key: 'region', label: t('Region'), data: dictionaries.regions },
    { key: 'ownership', label: t('Ownership'), data: dictionaries.ownerships },
    { key: 'type', label: t('University type'), data: dictionaries.types },
    {
      key: 'gpaEdit',
      label: t('GPA edit'),
      data: [
        { code: 'true', name: t('Yes') },
        { code: 'false', name: t('No') },
      ],
      type: 'boolean' as const,
    },
    {
      key: 'active',
      label: t('Active'),
      data: [
        { code: 'true', name: t('Active') },
        { code: 'false', name: t('Inactive') },
      ],
      type: 'boolean' as const,
    },
  ]

  // Sync URL search params
  useEffect(() => {
    const params: Record<string, string> = {}
    if (currentPage > 0) params.page = String(currentPage)
    if (pageSize !== 20) params.size = String(pageSize)
    if (search) params.q = search
    if (searchScope !== 'all') params.scope = searchScope
    setSearchParams(params)
  }, [currentPage, pageSize, search, searchScope, setSearchParams])

  useEffect(() => {
    localStorage.setItem('universities-column-visibility', JSON.stringify(columnVisibility))
  }, [columnVisibility])

  // Handlers
  const handleSearch = () => {
    setSearch(searchInput)
    setCurrentPage(0)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setCurrentPage(0)
  }

  const handleRefresh = () => {
    refetch()
    toast.success(t('Data refreshed'))
  }

  const handleExport = async () => {
    try {
      await universitiesApi.exportUniversities({})
      toast.success(t('Excel file downloading...'))
    } catch (error) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      toast.error(extractApiErrorMessage(error, t('Export failed')))
    }
  }

  const handleClearFilters = () => {
    setHorizontalFilters([])
    setSearchInput('')
    setSearch('')
    setSearchScope('all')
    setCurrentPage(0)
  }

  const handleAddHorizontalFilter = (filterKey: string) => {
    const filter = availableHorizontalFilters.find((f) => f.key === filterKey)
    if (!filter) return

    if (!horizontalFilters.find((f) => f.key === filterKey)) {
      setHorizontalFilters([
        ...horizontalFilters,
        {
          key: filterKey,
          label: filter.label,
          selectedCodes: [],
        },
      ])
    }
  }

  const handleRemoveHorizontalFilter = (filterKey: string) => {
    setHorizontalFilters(horizontalFilters.filter((f) => f.key !== filterKey))
  }

  const handleUpdateHorizontalFilter = (filterKey: string, codes: string[]) => {
    setHorizontalFilters(
      horizontalFilters.map((f) => (f.key === filterKey ? { ...f, selectedCodes: codes } : f)),
    )
  }

  const handleDelete = (code: string) => {
    deleteUniversityMutation.mutate(code, {
      onSettled: () => setDeleteConfirm({ show: false, code: null }),
    })
  }

  const handleEdit = (university: UniversityRow) => {
    setEditingUniversity(university)
    setShowFormDialog(true)
  }

  const handleFormSuccess = () => {
    setShowFormDialog(false)
    setEditingUniversity(null)
    queryClient.invalidateQueries({ queryKey: queryKeys.universities.all })
  }

  const handleFormCancel = () => {
    setShowFormDialog(false)
    setEditingUniversity(null)
  }

  // Table columns
  const columns: ColumnDef<UniversityRow>[] = [
    {
      id: 'actions',
      header: () => <div className="text-center">{t('Actions')}</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedUniversity(row.original.code)
            }}
            className="rounded-lg bg-blue-50 p-2 transition-colors hover:bg-blue-100"
            title={t('View')}
            aria-label={t('View')}
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(row.original)
            }}
            className="rounded-lg bg-green-50 p-2 transition-colors hover:bg-green-100"
            title={t('Edit')}
            aria-label={t('Edit')}
          >
            <Edit className="h-4 w-4 text-green-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeleteConfirm({ show: true, code: row.original.code })
            }}
            className="rounded-lg bg-red-50 p-2 transition-colors hover:bg-red-100"
            title={t('Delete')}
            aria-label={t('Delete')}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      ),
      size: 150,
      enableHiding: false,
    },
    {
      accessorKey: 'code',
      header: t('Code'),
      size: 100,
    },
    {
      accessorKey: 'name',
      header: t('Name'),
      size: 300,
    },
    {
      accessorKey: 'tin',
      header: t('INN'),
      size: 120,
    },
    {
      accessorKey: 'region',
      header: t('Region'),
      size: 150,
    },
    {
      accessorKey: 'ownership',
      header: t('Ownership'),
      size: 150,
    },
    {
      accessorKey: 'type',
      header: t('Type'),
      size: 150,
    },
    {
      accessorKey: 'address',
      header: t('Address'),
      size: 250,
    },
    {
      accessorKey: 'cadastre',
      header: t('Cadastre'),
      size: 150,
    },
    {
      accessorKey: 'active',
      header: t('Status'),
      cell: ({ row }) => (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            row.original.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.original.active ? t('Active') : t('Inactive')}
        </span>
      ),
      size: 100,
    },
  ]

  const table = useReactTable({
    data: universities,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="p-3">
      {/* Container - stat-ministry style */}
      <div className="rounded-lg bg-white p-3">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-gray-800">{t('Institutions list')}</h3>
          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                showFiltersPanel
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              {horizontalFilters.length > 0 && (
                <span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-blue-600">
                  {horizontalFilters.length}
                </span>
              )}
            </button>

            {/* Search Scope Selector */}
            <SearchScopeSelector
              value={searchScope}
              onChange={setSearchScope}
              scopes={searchScopes}
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />

            {/* Add Button */}
            <button
              onClick={() => setShowFormDialog(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {t('Add')}
            </button>

            {/* Excel Button */}
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>

            {/* Column Settings Popover */}
            <ColumnSettingsPopover
              columns={table
                .getAllLeafColumns()
                .filter((col) => col.id !== 'actions')
                .map((col) => ({
                  id: col.id,
                  label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
                  visible: col.getIsVisible(),
                  canHide: col.id !== 'actions',
                }))}
              onToggle={(columnId) => {
                const column = table.getColumn(columnId)
                if (column) {
                  column.toggleVisibility()
                }
              }}
            />
          </div>
        </div>

        {/* Filters Panel - stat-ministry style */}
        {showFiltersPanel && (
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            {/* Add Filter Buttons */}
            <div className="mb-3 flex flex-wrap gap-2">
              {availableHorizontalFilters
                .filter((f) => !horizontalFilters.find((hf) => hf.key === f.key))
                .map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleAddHorizontalFilter(filter.key)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    + {filter.label}
                  </button>
                ))}
            </div>

            {/* Active Filters */}
            {horizontalFilters.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  {horizontalFilters.map((filter) => {
                    const filterData = availableHorizontalFilters.find((f) => f.key === filter.key)
                    if (!filterData) return null

                    return (
                      <CustomTagFilter
                        key={filter.key}
                        label={filter.label}
                        data={filterData.data}
                        value={filter.selectedCodes}
                        onChange={(codes) => handleUpdateHorizontalFilter(filter.key, codes)}
                        onClose={() => handleRemoveHorizontalFilter(filter.key)}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Clear Filters & Refresh */}
            {(horizontalFilters.length > 0 || search) && (
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FilterX className="h-4 w-4" />
                  {t('Clear')}
                </button>

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {t('Refresh')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table Info */}
        <div className="flex items-center justify-between px-1 py-2 text-sm text-gray-600">
          <div>
            {t('Total')}: <span className="font-semibold">{totalElements}</span>
          </div>
          <div>
            {t('Page')}: <span className="font-semibold">{currentPage + 1}</span> /{' '}
            <span className="font-semibold">{totalPages || 1}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                      {t('Loading...')}
                    </td>
                  </tr>
                ) : universities.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                      {t('No data found')}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm whitespace-nowrap text-gray-900"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">{t('Per page')}:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(0)
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-1.5 text-sm text-gray-700">
              {currentPage + 1} / {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <UniversityDetailDrawer
        code={selectedUniversity}
        open={!!selectedUniversity}
        onClose={() => setSelectedUniversity(null)}
      />

      {/* Form Dialog */}
      <UniversityFormDialog
        open={showFormDialog}
        university={editingUniversity}
        onSuccess={handleFormSuccess}
        onOpenChange={(open) => {
          if (!open) handleFormCancel()
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirm.show}
        onOpenChange={(open) => !open && setDeleteConfirm({ show: false, code: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete university')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Are you sure you want to delete this university? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm.code && handleDelete(deleteConfirm.code)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
