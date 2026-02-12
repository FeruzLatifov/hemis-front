import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  type SortingState,
  type VisibilityState,
  type ColumnSizingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { type UniversitiesParams, type UniversityRow } from '@/api/universities.api'
import {
  useUniversities,
  useUniversityDictionaries,
  useDeleteUniversity,
} from '@/hooks/useUniversities'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PAGINATION, UI } from '@/constants'
import {
  SlidersHorizontal,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Rows3,
} from 'lucide-react'
import { SearchScopeSelector } from '@/components/filters/SearchScopeSelector'
import { ColumnSettingsPopover } from '@/components/filters/ColumnSettingsPopover'
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import { Skeleton } from '@/components/ui/skeleton'
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

import { type ResolvedRow, useUniversitiesColumns } from './universities-columns'
import { UniversitiesFilters, type UniversitiesFilterValues } from './UniversitiesFilters'
import { buildFilterParams, handleExportAll, handleExportSelected } from './universities-export'

type Density = 'compact' | 'comfortable'

// ─── Main component ──────────────────────────────────────────────
export default function UniversitiesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // ─── URL-driven state ─────────────────────────────────────────────
  const currentPage = Number(searchParams.get('page')) || 0
  const pageSize = Number(searchParams.get('size')) || PAGINATION.DEFAULT_PAGE_SIZE
  const searchFromUrl = searchParams.get('q') || ''
  const searchScope = searchParams.get('scope') || 'all'
  const sortFromUrl = searchParams.get('sort') || 'name,asc'
  const regionId = searchParams.get('regionId') || ''
  const ownershipId = searchParams.get('ownershipId') || ''
  const typeId = searchParams.get('typeId') || ''
  const activityStatusId = searchParams.get('activityStatusId') || ''
  const belongsToId = searchParams.get('belongsToId') || ''
  const contractCategoryId = searchParams.get('contractCategoryId') || ''
  const versionTypeId = searchParams.get('versionTypeId') || ''
  const districtId = searchParams.get('districtId') || ''
  const activeFilter = searchParams.get('active') || ''
  const gpaEditFilter = searchParams.get('gpaEdit') || ''
  const accreditationEditFilter = searchParams.get('accreditationEdit') || ''
  const addStudentFilter = searchParams.get('addStudent') || ''
  const allowGroupingFilter = searchParams.get('allowGrouping') || ''
  const allowTransferOutsideFilter = searchParams.get('allowTransferOutside') || ''

  // ─── Local UI state ───────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sorting, setSorting] = useState<SortingState>(() => {
    const [id, direction] = sortFromUrl.split(',')
    return [{ id: id || 'name', desc: direction === 'desc' }]
  })

  const [showFiltersPanel, setShowFiltersPanel] = useState(
    () =>
      !!(
        regionId ||
        ownershipId ||
        typeId ||
        activityStatusId ||
        belongsToId ||
        contractCategoryId ||
        versionTypeId ||
        districtId ||
        activeFilter ||
        gpaEditFilter ||
        accreditationEditFilter ||
        addStudentFilter ||
        allowGroupingFilter ||
        allowTransferOutsideFilter
      ),
  )

  // Columns hidden by default (user can toggle via column settings)
  const defaultHiddenColumns: VisibilityState = {
    address: false,
    mailAddress: false,
    soatoRegion: false,
    terrain: false,
    cadastre: false,
    universityUrl: false,
    teacherUrl: false,
    studentUrl: false,
    uzbmbUrl: false,
    gpaEdit: false,
    accreditationEdit: false,
    addStudent: false,
    allowGrouping: false,
    allowTransferOutside: false,
    bankInfo: false,
    accreditationInfo: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const saved = localStorage.getItem('universities-column-visibility')
      return saved ? { ...defaultHiddenColumns, ...JSON.parse(saved) } : defaultHiddenColumns
    } catch {
      return defaultHiddenColumns
    }
  })

  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => {
    try {
      const saved = localStorage.getItem('universities-column-sizing')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [density, setDensity] = useState<Density>(() => {
    try {
      const saved = localStorage.getItem('universities-table-density') as Density
      return saved === 'compact' ? 'compact' : 'comfortable'
    } catch {
      return 'comfortable'
    }
  })

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; code: string | null }>({
    show: false,
    code: null,
  })

  // ─── Debounced search ─────────────────────────────────────────────
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // ─── Sort param ───────────────────────────────────────────────────
  const sortParam = useMemo(() => {
    if (sorting.length === 0) return 'name,asc'
    return `${sorting[0].id},${sorting[0].desc ? 'desc' : 'asc'}`
  }, [sorting])

  useEffect(() => {
    if (sortParam !== sortFromUrl) {
      updateSearchParams({ sort: sortParam === 'name,asc' ? undefined : sortParam })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortParam])

  // ─── Persist to localStorage ──────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('universities-column-visibility', JSON.stringify(columnVisibility))
  }, [columnVisibility])

  useEffect(() => {
    localStorage.setItem('universities-column-sizing', JSON.stringify(columnSizing))
  }, [columnSizing])

  useEffect(() => {
    localStorage.setItem('universities-table-density', density)
  }, [density])

  // ─── Keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Ctrl+K → focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchContainerRef.current?.querySelector<HTMLInputElement>('input')?.focus()
        return
      }

      // / → focus search (only when not in input)
      if (e.key === '/' && !isInput) {
        e.preventDefault()
        searchContainerRef.current?.querySelector<HTMLInputElement>('input')?.focus()
        return
      }

      // Escape → clear selection
      if (e.key === 'Escape') {
        if (Object.keys(rowSelection).length > 0) {
          setRowSelection({})
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [rowSelection])

  // ─── Shared filter state for export and query params ──────────────
  const currentFilters = useMemo(
    () => ({
      debouncedSearch,
      searchScope,
      regionId,
      ownershipId,
      typeId,
      activityStatusId,
      belongsToId,
      contractCategoryId,
      versionTypeId,
      districtId,
      activeFilter,
      gpaEditFilter,
      accreditationEditFilter,
      addStudentFilter,
      allowGroupingFilter,
      allowTransferOutsideFilter,
    }),
    [
      debouncedSearch,
      searchScope,
      regionId,
      ownershipId,
      typeId,
      activityStatusId,
      belongsToId,
      contractCategoryId,
      versionTypeId,
      districtId,
      activeFilter,
      gpaEditFilter,
      accreditationEditFilter,
      addStudentFilter,
      allowGroupingFilter,
      allowTransferOutsideFilter,
    ],
  )

  // ─── Build query params ───────────────────────────────────────────
  const queryParams = useMemo<UniversitiesParams>(() => {
    const filterParams = buildFilterParams(currentFilters)
    return {
      page: currentPage,
      size: pageSize,
      sort: sortParam,
      ...filterParams,
    }
  }, [currentPage, pageSize, sortParam, currentFilters])

  // ─── Data fetching ────────────────────────────────────────────────
  const { data: pagedData, isLoading, isPlaceholderData, refetch } = useUniversities(queryParams)

  const universities = useMemo(() => pagedData?.content ?? [], [pagedData?.content])
  const totalElements = pagedData?.totalElements ?? 0
  const totalPages = pagedData?.totalPages ?? 0

  const {
    data: dictionaries = {
      regions: [],
      ownerships: [],
      types: [],
      activityStatuses: [],
      belongsToOptions: [],
      contractCategories: [],
      versionTypes: [],
      districts: [],
    },
  } = useUniversityDictionaries()
  const deleteUniversityMutation = useDeleteUniversity()

  const loading = isLoading && !isPlaceholderData

  // ─── Code → Name resolution ───────────────────────────────────────
  const resolvedData = useMemo(() => {
    return universities.map((u) => ({
      ...u,
      regionName:
        dictionaries.regions.find((r) => r.code === u.regionCode)?.name ?? u.regionCode ?? '',
      ownershipName:
        dictionaries.ownerships.find((o) => o.code === u.ownershipCode)?.name ??
        u.ownershipCode ??
        '',
      typeName:
        dictionaries.types.find((dt) => dt.code === u.universityTypeCode)?.name ??
        u.universityTypeCode ??
        '',
      activityStatusName:
        dictionaries.activityStatuses.find((s) => s.code === u.activityStatusCode)?.name ??
        u.activityStatusCode ??
        '',
      belongsToName:
        dictionaries.belongsToOptions.find((b) => b.code === u.belongsToCode)?.name ??
        u.belongsToCode ??
        '',
      contractCategoryName:
        dictionaries.contractCategories.find((c) => c.code === u.contractCategoryCode)?.name ??
        u.contractCategoryCode ??
        '',
      versionTypeName:
        dictionaries.versionTypes.find((v) => v.code === u.versionTypeCode)?.name ??
        u.versionTypeCode ??
        '',
      soatoRegionName:
        dictionaries.districts.find((d) => d.code === u.soatoRegion)?.name ??
        dictionaries.regions.find((r) => r.code === u.soatoRegion)?.name ??
        u.soatoRegion ??
        '',
    }))
  }, [universities, dictionaries])

  // ─── Search scopes ─────────────────────────────────────────────────
  const searchScopes = useMemo(
    () => [
      { value: 'all', label: t('All') },
      { value: 'code', label: t('Code') },
      { value: 'name', label: t('Name') },
      { value: 'tin', label: t('INN') },
      { value: 'address', label: t('Address') },
      { value: 'mailAddress', label: t('Mail address') },
      { value: 'cadastre', label: t('Cadastre') },
      { value: 'bankInfo', label: t('Bank info') },
      { value: 'accreditationInfo', label: t('Accreditation info') },
    ],
    [t],
  )

  const hasActiveFilters = !!(
    regionId ||
    ownershipId ||
    typeId ||
    activityStatusId ||
    belongsToId ||
    contractCategoryId ||
    versionTypeId ||
    districtId ||
    activeFilter ||
    gpaEditFilter ||
    accreditationEditFilter ||
    addStudentFilter ||
    allowGroupingFilter ||
    allowTransferOutsideFilter
  )
  const activeFilterCount = [
    regionId,
    ownershipId,
    typeId,
    activityStatusId,
    belongsToId,
    contractCategoryId,
    versionTypeId,
    districtId,
    activeFilter,
    gpaEditFilter,
    accreditationEditFilter,
    addStudentFilter,
    allowGroupingFilter,
    allowTransferOutsideFilter,
    debouncedSearch,
  ].filter(Boolean).length
  const selectedRowCount = Object.keys(rowSelection).length

  // ─── Filter values for UniversitiesFilters ────────────────────────
  const filterValues = useMemo<UniversitiesFilterValues>(
    () => ({
      regionId,
      ownershipId,
      typeId,
      activityStatusId,
      belongsToId,
      contractCategoryId,
      versionTypeId,
      districtId,
      activeFilter,
      gpaEditFilter,
      accreditationEditFilter,
      addStudentFilter,
      allowGroupingFilter,
      allowTransferOutsideFilter,
    }),
    [
      regionId,
      ownershipId,
      typeId,
      activityStatusId,
      belongsToId,
      contractCategoryId,
      versionTypeId,
      districtId,
      activeFilter,
      gpaEditFilter,
      accreditationEditFilter,
      addStudentFilter,
      allowGroupingFilter,
      allowTransferOutsideFilter,
    ],
  )

  // ─── URL helpers ──────────────────────────────────────────────────
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

  // ─── Filter handlers ─────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (key: string, values: string[]) => {
      updateSearchParams({
        [key]: values.length > 0 ? values.join(',') : undefined,
        page: undefined,
      })
    },
    [updateSearchParams],
  )

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleSearch = useCallback(() => {
    setDebouncedSearch(searchInput)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
  }, [searchInput])

  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    setDebouncedSearch('')
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
  }, [])

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({ page: page > 0 ? String(page) : undefined })
      setRowSelection({})
    },
    [updateSearchParams],
  )

  const handlePageSizeChange = useCallback(
    (size: number) => {
      updateSearchParams({
        size: size !== PAGINATION.DEFAULT_PAGE_SIZE ? String(size) : undefined,
        page: undefined,
      })
      setRowSelection({})
    },
    [updateSearchParams],
  )

  const handleScopeChange = useCallback(
    (scope: string) => {
      updateSearchParams({ scope: scope !== 'all' ? scope : undefined })
    },
    [updateSearchParams],
  )

  const handleRefresh = useCallback(() => {
    refetch()
    toast.success(t('Data refreshed'))
  }, [refetch, t])

  const onExportAll = useCallback(async () => {
    const filterParams = buildFilterParams(currentFilters)
    await handleExportAll(filterParams, dictionaries, t)
  }, [currentFilters, dictionaries, t])

  const onExportSelected = useCallback(async () => {
    const selectedRows = resolvedData.filter(
      (_, index) => rowSelection[String(index)],
    ) as UniversityRow[]
    await handleExportSelected(selectedRows, dictionaries, t)
  }, [rowSelection, resolvedData, dictionaries, t])

  const handleClearFilters = useCallback(() => {
    setSearchInput('')
    setDebouncedSearch('')
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    updateSearchParams({
      q: undefined,
      scope: undefined,
      regionId: undefined,
      ownershipId: undefined,
      typeId: undefined,
      activityStatusId: undefined,
      belongsToId: undefined,
      contractCategoryId: undefined,
      versionTypeId: undefined,
      districtId: undefined,
      active: undefined,
      gpaEdit: undefined,
      accreditationEdit: undefined,
      addStudent: undefined,
      allowGrouping: undefined,
      allowTransferOutside: undefined,
      page: undefined,
    })
  }, [updateSearchParams])

  const handleDelete = useCallback(
    (code: string) => {
      deleteUniversityMutation.mutate(code, {
        onSettled: () => setDeleteConfirm({ show: false, code: null }),
      })
    },
    [deleteUniversityMutation],
  )

  const handleRowClick = useCallback(
    (code: string) => {
      navigate(`/institutions/universities/${code}`)
    },
    [navigate],
  )

  const handleCopyToClipboard = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text)
      toast.success(t('Copied'))
    },
    [t],
  )

  // ─── Table columns ────────────────────────────────────────────────
  const columns = useUniversitiesColumns({
    t,
    handleCopyToClipboard,
    currentPage,
    pageSize,
    debouncedSearch,
  })

  const table = useReactTable({
    data: resolvedData as ResolvedRow[],
    columns,
    state: {
      columnVisibility,
      sorting,
      columnSizing,
      rowSelection,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableRowSelection: true,
  })

  // ─── Helpers ────────────────────────────────────────────────────────
  const getSortIcon = (columnId: string) => {
    const sort = sorting.find((s) => s.id === columnId)
    if (!sort) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-gray-400" />
    return sort.desc ? (
      <ArrowDown className="ml-1 inline h-3 w-3 text-[var(--primary)]" />
    ) : (
      <ArrowUp className="ml-1 inline h-3 w-3 text-[var(--primary)]" />
    )
  }

  const isCompact = density === 'compact'
  const cellPx = isCompact ? 'px-2 py-1' : 'px-3 py-2'
  const headerPx = isCompact ? 'px-2 py-1.5' : 'px-3 py-2.5'
  const cellText = isCompact ? 'text-xs' : 'text-sm'

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-3 p-4">
      {/* ──── Card Container ──── */}
      <div className="rounded-lg border border-[var(--border-color-pro)] bg-white">
        {/* ──── Toolbar ──── */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              showFiltersPanel || activeFilterCount > 0
                ? 'border-[var(--primary)]/20 bg-[var(--active-bg)] text-[var(--primary)]'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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

          {/* Search */}
          <div ref={searchContainerRef}>
            <SearchScopeSelector
              value={searchScope}
              onChange={handleScopeChange}
              scopes={searchScopes}
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Total count */}
          <span className="text-xs text-gray-500 tabular-nums">
            {t('Total')}: <span className="font-semibold text-gray-700">{totalElements}</span>
          </span>

          <div className="h-5 w-px bg-gray-200" />

          {/* Density toggle */}
          <button
            onClick={() => setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))}
            className={`rounded-lg p-1.5 transition-colors ${
              isCompact
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title={isCompact ? t('Comfortable view') : t('Compact view')}
          >
            <Rows3 className="h-4 w-4" />
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
            title={t('Refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Excel */}
          <button
            onClick={onExportAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>

          {/* Column Settings */}
          <ColumnSettingsPopover
            columns={table
              .getAllLeafColumns()
              .filter((col) => col.id !== 'rowNumber' && col.id !== 'select')
              .map((col) => ({
                id: col.id,
                label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
                visible: col.getIsVisible(),
                canHide: col.id !== 'rowNumber' && col.id !== 'select',
              }))}
            onToggle={(columnId) => {
              const column = table.getColumn(columnId)
              if (column) column.toggleVisibility()
            }}
          />

          <div className="h-5 w-px bg-gray-200" />

          {/* Add Button */}
          <button
            onClick={() => navigate('/institutions/universities/create')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
            {t('Add')}
          </button>
        </div>

        {/* ──── Filters ──── */}
        <UniversitiesFilters
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          showPanel={showFiltersPanel}
          hasActiveFilters={hasActiveFilters}
          dictionaries={dictionaries}
          t={t}
        />

        {/* ──── Bulk action bar ──── */}
        {selectedRowCount > 0 && (
          <div className="flex items-center gap-3 border-b border-[var(--primary)]/10 bg-[var(--active-bg)] px-4 py-2">
            <span className="text-sm font-medium text-[var(--primary)]">
              {selectedRowCount} {t('selected')}
            </span>
            <div className="h-4 w-px bg-[var(--primary)]/20" />
            <button
              onClick={onExportSelected}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <FileSpreadsheet className="h-3 w-3" />
              {t('Export selected')}
            </button>
            <button
              onClick={() => setRowSelection({})}
              className="ml-auto text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              {t('Clear')}
            </button>
          </div>
        )}

        {/* ──── Progress bar ──── */}
        {(isLoading || isPlaceholderData) && (
          <div className="progress-indeterminate h-0.5 w-full" />
        )}

        {/* ──── Table ──── */}
        <div className="overflow-x-auto">
          <table
            className="w-full"
            style={{ tableLayout: 'fixed', minWidth: table.getCenterTotalSize() }}
          >
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-100">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    return (
                      <th
                        key={header.id}
                        className={`relative bg-gray-50 text-left font-medium text-gray-500 ${headerPx} ${cellText} ${
                          canSort ? 'cursor-pointer select-none hover:text-gray-700' : ''
                        }`}
                        style={{ width: header.getSize() }}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <span className="inline-flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && getSortIcon(header.column.id)}
                        </span>
                        {header.column.getCanResize() && (
                          <div
                            role="slider"
                            tabIndex={0}
                            aria-label={`Resize ${header.column.id}`}
                            aria-valuenow={header.column.getSize()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setColumnSizing((prev) => {
                                  const next = { ...prev }
                                  delete next[header.column.id]
                                  return next
                                })
                              }
                            }}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onDoubleClick={() => {
                              setColumnSizing((prev) => {
                                const next = { ...prev }
                                delete next[header.column.id]
                                return next
                              })
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none transition-colors select-none hover:bg-[var(--primary)] ${
                              header.column.getIsResizing()
                                ? 'bg-[var(--primary)]'
                                : 'bg-transparent'
                            }`}
                          />
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    {table.getVisibleLeafColumns().map((col) => (
                      <td key={col.id} className={cellPx} style={{ width: col.getSize() }}>
                        <Skeleton className={`${isCompact ? 'h-3' : 'h-4'} w-full rounded`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : resolvedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={table.getVisibleLeafColumns().length}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('No data found')}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {debouncedSearch || hasActiveFilters
                            ? t('Try changing your search or filters')
                            : t('No universities have been added yet')}
                        </p>
                      </div>
                      {!debouncedSearch && !hasActiveFilters && (
                        <button
                          onClick={() => navigate('/institutions/universities/create')}
                          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t('Add')}
                        </button>
                      )}
                      {(debouncedSearch || hasActiveFilters) && (
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
                table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row.original.code)}
                    className={`group/row cursor-pointer border-b border-gray-50 transition-colors hover:bg-slate-50 ${
                      row.getIsSelected()
                        ? 'bg-[var(--active-bg)]'
                        : rowIndex % 2 === 1
                          ? 'bg-gray-50'
                          : 'bg-white'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`overflow-hidden text-ellipsis whitespace-nowrap ${cellPx} ${cellText}`}
                        style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
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

        {/* ──── Pagination ──── */}
        <div className="border-t border-gray-100 px-4">
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

      {/* ──── Delete Confirmation ──── */}
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
              className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            >
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
