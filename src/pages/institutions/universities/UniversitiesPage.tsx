import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useStableCallback } from '@/hooks/useStableCallback'
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
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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
import { ACTIVITY_STATUS_LABEL_KEY } from './activity-statuses'
import { buildFilterParams, handleExportAll, handleExportSelected } from './universities-export'
import { UniversitiesToolbar } from './UniversitiesToolbar'
import { UniversitiesBulkActionBar } from './UniversitiesBulkActionBar'
import { UniversitiesEmptyState } from './UniversitiesEmptyState'

type Density = 'compact' | 'comfortable'

// ─── Main component ──────────────────────────────────────────────
export default function UniversitiesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // ─── URL-driven state (validated) ────────────────────────────────
  const currentPage = Math.max(
    0,
    Math.min(9999, parseInt(searchParams.get('page') || '0', 10) || 0),
  )
  const pageSize = Math.max(
    1,
    Math.min(
      500,
      parseInt(searchParams.get('size') || String(PAGINATION.DEFAULT_PAGE_SIZE), 10) ||
        PAGINATION.DEFAULT_PAGE_SIZE,
    ),
  )
  const searchFromUrl = (searchParams.get('q') || '').slice(0, 200)
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
  const oneIdFilter = searchParams.get('oneId') || ''
  const gradingSystemFilter = searchParams.get('gradingSystem') || ''
  const addForeignStudentFilter = searchParams.get('addForeignStudent') || ''
  const addTransferStudentFilter = searchParams.get('addTransferStudent') || ''
  const addAcademicMobileStudentFilter = searchParams.get('addAcademicMobileStudent') || ''

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
        allowTransferOutsideFilter ||
        oneIdFilter ||
        gradingSystemFilter ||
        addForeignStudentFilter ||
        addTransferStudentFilter ||
        addAcademicMobileStudentFilter
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

  // One-way sync from local state → URL via stable callback (latest values, stable identity).
  const syncSearchToUrl = useStableCallback(() => {
    if (debouncedSearch !== searchFromUrl) {
      updateSearchParams({ q: debouncedSearch || undefined, page: undefined })
    }
  })

  useEffect(() => {
    syncSearchToUrl()
  }, [debouncedSearch, syncSearchToUrl])

  // ─── Sort param ───────────────────────────────────────────────────
  const sortParam = useMemo(() => {
    if (sorting.length === 0) return 'name,asc'
    return `${sorting[0].id},${sorting[0].desc ? 'desc' : 'asc'}`
  }, [sorting])

  const syncSortToUrl = useStableCallback(() => {
    if (sortParam !== sortFromUrl) {
      updateSearchParams({ sort: sortParam === 'name,asc' ? undefined : sortParam })
    }
  })

  useEffect(() => {
    syncSortToUrl()
  }, [sortParam, syncSortToUrl])

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
      oneIdFilter,
      gradingSystemFilter,
      addForeignStudentFilter,
      addTransferStudentFilter,
      addAcademicMobileStudentFilter,
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
      oneIdFilter,
      gradingSystemFilter,
      addForeignStudentFilter,
      addTransferStudentFilter,
      addAcademicMobileStudentFilter,
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

  // Backend ClassifierLookupService already resolved code → name (single source of truth).
  // Frontend simply passes the resolved names through to the table.
  const resolvedData = useMemo(
    () =>
      universities.map((u) => ({
        ...u,
        regionName: u.region ?? '',
        ownershipName: u.ownership ?? '',
        typeName: u.universityType ?? '',
        activityStatusName:
          (u.activityStatusCode && ACTIVITY_STATUS_LABEL_KEY[u.activityStatusCode]
            ? t(ACTIVITY_STATUS_LABEL_KEY[u.activityStatusCode])
            : u.activityStatus) ?? '',
        belongsToName: u.belongsTo ?? '',
        contractCategoryName: u.contractCategory ?? '',
        versionTypeName: u.versionType ?? '',
        soatoRegionName: u.soatoRegionName ?? '',
      })),
    [universities, t],
  )

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
    allowTransferOutsideFilter ||
    oneIdFilter ||
    gradingSystemFilter ||
    addForeignStudentFilter ||
    addTransferStudentFilter ||
    addAcademicMobileStudentFilter
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
    oneIdFilter,
    gradingSystemFilter,
    addForeignStudentFilter,
    addTransferStudentFilter,
    addAcademicMobileStudentFilter,
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
      oneIdFilter,
      gradingSystemFilter,
      addForeignStudentFilter,
      addTransferStudentFilter,
      addAcademicMobileStudentFilter,
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
      oneIdFilter,
      gradingSystemFilter,
      addForeignStudentFilter,
      addTransferStudentFilter,
      addAcademicMobileStudentFilter,
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
      oneId: undefined,
      gradingSystem: undefined,
      addForeignStudent: undefined,
      addTransferStudent: undefined,
      addAcademicMobileStudent: undefined,
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
    if (!sort) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-[var(--text-secondary)]" />
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
      <div className="rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)]">
        {/* ──── Toolbar ──── */}
        <UniversitiesToolbar
          showFiltersPanel={showFiltersPanel}
          onToggleFiltersPanel={() => setShowFiltersPanel(!showFiltersPanel)}
          activeFilterCount={activeFilterCount}
          searchScope={searchScope}
          onScopeChange={handleScopeChange}
          searchScopes={searchScopes}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          searchContainerRef={searchContainerRef}
          totalElements={totalElements}
          isLoading={isLoading}
          density={density}
          onDensityToggle={() => setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))}
          onRefresh={handleRefresh}
          onExportAll={onExportAll}
          table={table}
        />

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
        <UniversitiesBulkActionBar
          selectedCount={selectedRowCount}
          onExportSelected={onExportSelected}
          onClearSelection={() => setRowSelection({})}
        />

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
                <tr key={headerGroup.id} className="border-b border-[var(--border-color-pro)]">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    return (
                      <th
                        key={header.id}
                        className={`relative bg-[var(--table-row-alt)] text-left font-medium text-[var(--text-secondary)] ${headerPx} ${cellText} ${
                          canSort
                            ? 'cursor-pointer select-none hover:text-[var(--text-primary)]'
                            : ''
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
                  <tr
                    key={`skeleton-${i}`}
                    className={i % 2 === 1 ? 'bg-[var(--table-row-alt)]' : ''}
                  >
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
                    <UniversitiesEmptyState
                      isFiltered={!!debouncedSearch || hasActiveFilters}
                      onCreate={() => navigate('/institutions/universities/create')}
                      onClearFilters={handleClearFilters}
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row.original.code)}
                    className={`group/row cursor-pointer border-b border-[var(--border-color-pro)] transition-colors hover:bg-[var(--hover-bg)] ${
                      row.getIsSelected()
                        ? 'bg-[var(--active-bg)]'
                        : rowIndex % 2 === 1
                          ? 'bg-[var(--table-row-alt)]'
                          : 'bg-[var(--card-bg)]'
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
              className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
