import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { PAGINATION, UI } from '@/constants'
import { useRolesList, useDeleteRole } from '@/hooks/useRoles'
import { useAuthStore } from '@/stores/authStore'
import { useRolesColumns } from './roles-columns'
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
import { Input } from '@/components/ui/input'
import { Search, Plus, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Shield } from 'lucide-react'
import type { RoleAdmin, RolesParams } from '@/types/role.types'

type DialogState = { type: 'idle' } | { type: 'delete'; role: RoleAdmin }

export default function RolesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { permissions } = useAuthStore()

  const canManage = permissions.includes('roles.manage')

  // ─── URL-driven state ──────────────────────────────────────────────
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
  const sortFromUrl = searchParams.get('sort') || 'name,asc'

  // ─── Local state ───────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sorting, setSorting] = useState<SortingState>(() => {
    const [id, direction] = sortFromUrl.split(',')
    return [{ id: id || 'name', desc: direction === 'desc' }]
  })

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const saved = localStorage.getItem('roles-column-visibility')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // ─── Dialog state ──────────────────────────────────────────────────
  const [dialog, setDialog] = useState<DialogState>({ type: 'idle' })
  const closeDialog = useCallback(() => setDialog({ type: 'idle' }), [])

  // ─── Debounced search ──────────────────────────────────────────────
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

  // ─── Sort sync ─────────────────────────────────────────────────────
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

  // ─── Persist column visibility ─────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('roles-column-visibility', JSON.stringify(columnVisibility))
  }, [columnVisibility])

  // ─── URL helpers ───────────────────────────────────────────────────
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

  // ─── Build query params ────────────────────────────────────────────
  const queryParams = useMemo<RolesParams>(() => {
    const params: RolesParams = {
      page: currentPage,
      size: pageSize,
      sort: sortParam,
    }
    if (debouncedSearch) params.search = debouncedSearch
    return params
  }, [currentPage, pageSize, sortParam, debouncedSearch])

  // ─── Data fetching ─────────────────────────────────────────────────
  const { data: pagedData, isLoading, isPlaceholderData, refetch } = useRolesList(queryParams)
  const roles = useMemo(() => pagedData?.content ?? [], [pagedData?.content])
  const totalElements = pagedData?.totalElements ?? 0
  const totalPages = pagedData?.totalPages ?? 0

  const deleteMutation = useDeleteRole()
  const loading = isLoading && !isPlaceholderData

  // ─── Handlers ──────────────────────────────────────────────────────
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

  const handleEdit = useCallback(
    (role: RoleAdmin) => navigate(`/system/roles/${role.id}/edit`),
    [navigate],
  )

  const handleCreate = useCallback(() => navigate('/system/roles/new'), [navigate])

  const handleDelete = useCallback(
    (role: RoleAdmin) => {
      deleteMutation.reset()
      setDialog({ type: 'delete', role })
    },
    [deleteMutation],
  )

  const handleDeleteConfirm = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault() // Prevent Radix from auto-closing the dialog
      if (dialog.type === 'delete') {
        deleteMutation.mutate(dialog.role.id, {
          onSuccess: () => closeDialog(),
          onError: () => closeDialog(), // Toast shown by useDeleteRole hook
        })
      }
    },
    [dialog, deleteMutation, closeDialog],
  )

  // ─── Table columns ─────────────────────────────────────────────────
  const columns = useRolesColumns({
    t,
    currentPage,
    pageSize,
    searchTerm: debouncedSearch,
    onEdit: handleEdit,
    onDelete: handleDelete,
    canManage,
  })

  const table = useReactTable({
    data: roles,
    columns,
    state: { columnVisibility, sorting },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  const getSortIcon = (columnId: string) => {
    const sort = sorting.find((s) => s.id === columnId)
    if (!sort) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-[var(--text-secondary)]" />
    return sort.desc ? (
      <ArrowDown className="ml-1 inline h-3 w-3 text-[var(--primary)]" />
    ) : (
      <ArrowUp className="ml-1 inline h-3 w-3 text-[var(--primary)]" />
    )
  }

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 p-4">
      <div className="rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)]">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color-pro)] px-4 py-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('Search roles...')}
              aria-label={t('Search roles...')}
              className="h-8 w-60 pl-8 text-sm"
            />
          </div>

          <div className="flex-1" />

          {/* Total */}
          <span className="text-xs text-[var(--text-secondary)] tabular-nums">
            {t('Total')}:{' '}
            <span className="font-semibold text-[var(--text-primary)]">{totalElements}</span>
          </span>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-secondary)] disabled:opacity-40"
            title={t('Refresh')}
            aria-label={t('Refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Role */}
          {canManage && (
            <>
              <div className="h-5 w-px bg-[var(--border-color-pro)]" />
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
              >
                <Plus className="h-4 w-4" />
                {t('Add')}
              </button>
            </>
          )}
        </div>

        {/* ── Progress bar ── */}
        {(isLoading || isPlaceholderData) && (
          <div className="progress-indeterminate h-0.5 w-full" />
        )}

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-[var(--border-color-pro)]">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    return (
                      <th
                        key={header.id}
                        className={`bg-[var(--table-row-alt)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)] ${
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
                      <td key={col.id} className="px-3 py-2" style={{ width: col.getSize() }}>
                        <Skeleton className="h-4 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : roles.length === 0 ? (
                <tr>
                  <td
                    colSpan={table.getVisibleLeafColumns().length}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Shield className="h-8 w-8 text-[var(--text-secondary)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {t('No roles found')}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                          {debouncedSearch
                            ? t('Try changing your search or filters')
                            : t('No roles have been created yet')}
                        </p>
                      </div>
                      {canManage && !debouncedSearch && (
                        <button
                          onClick={handleCreate}
                          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t('Add')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, rowIndex) => {
                  const isCustom = row.original.roleType !== 'SYSTEM'
                  return (
                    <tr
                      key={row.id}
                      onDoubleClick={() => isCustom && canManage && handleEdit(row.original)}
                      className={`group/row border-b border-[var(--border-color-pro)] transition-colors hover:bg-[var(--hover-bg)] ${
                        rowIndex % 2 === 1 ? 'bg-[var(--table-row-alt)]' : 'bg-[var(--card-bg)]'
                      } ${isCustom && canManage ? 'cursor-pointer' : ''}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="overflow-hidden px-3 py-2 text-sm text-ellipsis whitespace-nowrap"
                          style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
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

      {/* ── Delete Dialog ── */}
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete role')}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === 'delete'
                ? t(
                    'Are you sure you want to delete role "{{name}}"? This action cannot be undone.',
                    {
                      name: dialog.role.name,
                    },
                  )
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
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
