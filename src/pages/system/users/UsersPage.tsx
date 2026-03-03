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
import {
  useUsers,
  useRoles,
  useToggleStatus,
  useUnlockAccount,
  useDeleteUser,
} from '@/hooks/useUsers'
import { useUniversities } from '@/hooks/useUniversities'
import { useAuthStore } from '@/stores/authStore'
import { useUsersColumns } from './users-columns'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, Plus, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Users } from 'lucide-react'
import type { UserAdmin, UsersParams } from '@/types/user.types'

type DialogState =
  | { type: 'idle' }
  | { type: 'delete'; user: UserAdmin }
  | { type: 'toggle'; user: UserAdmin }
  | { type: 'unlock'; user: UserAdmin }

export default function UsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { permissions } = useAuthStore()

  // ─── Granular permissions ─────────────────────────────────────────
  const canCreate = permissions.includes('users.create') || permissions.includes('users.manage')
  const canEdit = permissions.includes('users.edit') || permissions.includes('users.manage')
  const canDelete = permissions.includes('users.delete') || permissions.includes('users.manage')
  const hasFullAccess =
    (canEdit || canCreate) &&
    (permissions.includes('universities.view') || permissions.includes('settings.view'))

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
  const roleFilter = searchParams.get('role') || ''
  const statusFilter = searchParams.get('status') || ''
  const universityFilter = searchParams.get('university') || ''
  const sortFromUrl = searchParams.get('sort') || 'username,asc'

  // ─── Local state ───────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sorting, setSorting] = useState<SortingState>(() => {
    const [id, direction] = sortFromUrl.split(',')
    return [{ id: id || 'username', desc: direction === 'desc' }]
  })

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const saved = localStorage.getItem('users-column-visibility')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // ─── Dialog state (discriminated union) ────────────────────────────
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
    if (sorting.length === 0) return 'username,asc'
    return `${sorting[0].id},${sorting[0].desc ? 'desc' : 'asc'}`
  }, [sorting])

  useEffect(() => {
    if (sortParam !== sortFromUrl) {
      updateSearchParams({ sort: sortParam === 'username,asc' ? undefined : sortParam })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortParam])

  // ─── Persist column visibility ─────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('users-column-visibility', JSON.stringify(columnVisibility))
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
  const queryParams = useMemo<UsersParams>(() => {
    const params: UsersParams = {
      page: currentPage,
      size: pageSize,
      sort: sortParam,
    }
    if (debouncedSearch) params.search = debouncedSearch
    if (roleFilter) params.role = roleFilter
    if (universityFilter) params.university = universityFilter
    if (statusFilter === 'active') params.enabled = 'true'
    else if (statusFilter === 'inactive') params.enabled = 'false'
    return params
  }, [
    currentPage,
    pageSize,
    sortParam,
    debouncedSearch,
    roleFilter,
    universityFilter,
    statusFilter,
  ])

  // ─── Data fetching ─────────────────────────────────────────────────
  const { data: pagedData, isLoading, isPlaceholderData, refetch } = useUsers(queryParams)
  const { data: roles = [] } = useRoles()
  const { data: universitiesData } = useUniversities(
    { size: 1000, sort: 'name,asc' },
    { enabled: hasFullAccess },
  )
  const universities = useMemo(() => universitiesData?.content ?? [], [universitiesData?.content])
  const users = useMemo(() => pagedData?.content ?? [], [pagedData?.content])
  const totalElements = pagedData?.totalElements ?? 0
  const totalPages = pagedData?.totalPages ?? 0

  const toggleStatusMutation = useToggleStatus()
  const unlockAccountMutation = useUnlockAccount()
  const deleteMutation = useDeleteUser()

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
    (user: UserAdmin) => navigate(`/system/users/${user.id}/edit`),
    [navigate],
  )

  const handleCreate = useCallback(() => navigate('/system/users/new'), [navigate])

  const handleToggleStatus = useCallback((user: UserAdmin) => {
    setDialog({ type: 'toggle', user })
  }, [])

  const handleUnlock = useCallback((user: UserAdmin) => {
    setDialog({ type: 'unlock', user })
  }, [])

  const handleDelete = useCallback((user: UserAdmin) => {
    setDialog({ type: 'delete', user })
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (dialog.type === 'delete') {
      deleteMutation.mutate(dialog.user.id, {
        onSettled: () => closeDialog(),
      })
    }
  }, [dialog, deleteMutation, closeDialog])

  const handleToggleConfirm = useCallback(() => {
    if (dialog.type === 'toggle') {
      toggleStatusMutation.mutate(dialog.user.id, {
        onSettled: () => closeDialog(),
      })
    }
  }, [dialog, toggleStatusMutation, closeDialog])

  const handleUnlockConfirm = useCallback(() => {
    if (dialog.type === 'unlock') {
      unlockAccountMutation.mutate(dialog.user.id, {
        onSettled: () => closeDialog(),
      })
    }
  }, [dialog, unlockAccountMutation, closeDialog])

  // ─── Table columns ────────────────────────────────────────────────
  const columns = useUsersColumns({
    t,
    currentPage,
    pageSize,
    searchTerm: debouncedSearch,
    onEdit: handleEdit,
    onToggleStatus: handleToggleStatus,
    onUnlock: handleUnlock,
    onDelete: handleDelete,
    canEdit,
    canDelete,
  })

  const table = useReactTable({
    data: users,
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
              placeholder={t('Search users...')}
              aria-label={t('Search users...')}
              className="h-8 w-60 pl-8 text-sm"
            />
          </div>

          {/* Role filter */}
          <Select
            value={roleFilter || 'all'}
            onValueChange={(val) =>
              updateSearchParams({ role: val === 'all' ? undefined : val, page: undefined })
            }
          >
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue placeholder={t('All roles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All roles')}</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.code}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={statusFilter || 'all'}
            onValueChange={(val) =>
              updateSearchParams({ status: val === 'all' ? undefined : val, page: undefined })
            }
          >
            <SelectTrigger className="h-8 w-32 text-sm">
              <SelectValue placeholder={t('All statuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All statuses')}</SelectItem>
              <SelectItem value="active">{t('Active')}</SelectItem>
              <SelectItem value="inactive">{t('Inactive')}</SelectItem>
            </SelectContent>
          </Select>

          {/* University filter — only for users with full access */}
          {hasFullAccess && (
            <Select
              value={universityFilter || 'all'}
              onValueChange={(val) =>
                updateSearchParams({ university: val === 'all' ? undefined : val, page: undefined })
              }
            >
              <SelectTrigger className="h-8 w-52 text-sm">
                <SelectValue placeholder={t('All universities')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All universities')}</SelectItem>
                {universities.map((u) => (
                  <SelectItem key={u.code} value={u.code}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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

          {/* Add User */}
          {canCreate && (
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
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={table.getVisibleLeafColumns().length}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-8 w-8 text-[var(--text-secondary)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {t('No users found')}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                          {debouncedSearch || roleFilter || statusFilter || universityFilter
                            ? t('Try changing your search or filters')
                            : t('No users have been created yet')}
                        </p>
                      </div>
                      {canCreate &&
                        !debouncedSearch &&
                        !roleFilter &&
                        !statusFilter &&
                        !universityFilter && (
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
                table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    onDoubleClick={() => canEdit && handleEdit(row.original)}
                    className={`group/row border-b border-[var(--border-color-pro)] transition-colors hover:bg-[var(--hover-bg)] ${
                      rowIndex % 2 === 1 ? 'bg-[var(--table-row-alt)]' : 'bg-[var(--card-bg)]'
                    } ${canEdit ? 'cursor-pointer' : ''}`}
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
                ))
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

      {/* ── Dialogs ── */}
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete user')}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === 'delete'
                ? t(
                    'Are you sure you want to delete user "{{username}}"? This action cannot be undone.',
                    {
                      username: dialog.user.username,
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

      <AlertDialog open={dialog.type === 'toggle'} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog.type === 'toggle' && dialog.user.enabled ? t('Disable') : t('Enable')}{' '}
              {t('user')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === 'toggle'
                ? t('Are you sure you want to {{action}} user "{{username}}"?', {
                    action: dialog.user.enabled ? t('disable') : t('enable'),
                    username: dialog.user.username,
                  })
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleStatusMutation.isPending}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleConfirm}
              disabled={toggleStatusMutation.isPending}
              className={
                dialog.type === 'toggle' && dialog.user.enabled
                  ? 'border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 dark:border-orange-900/30 dark:bg-orange-950/20 dark:text-orange-400 dark:hover:bg-orange-950/40'
                  : ''
              }
            >
              {dialog.type === 'toggle' && dialog.user.enabled ? t('Disable') : t('Enable')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog.type === 'unlock'} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('Unlock')} {t('user')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === 'unlock'
                ? t('Are you sure you want to unlock user "{{username}}"?', {
                    username: dialog.user.username,
                  })
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlockAccountMutation.isPending}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlockConfirm}
              disabled={unlockAccountMutation.isPending}
            >
              {t('Unlock')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
