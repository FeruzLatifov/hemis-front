import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import i18n from '@/i18n/config'
import type { UserAdmin } from '@/types/user.types'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Power, LockOpen, Trash2, Pencil } from 'lucide-react'
import { HighlightText } from './users-cells'

interface UseUsersColumnsOptions {
  t: (key: string) => string
  currentPage: number
  pageSize: number
  searchTerm: string
  onEdit: (user: UserAdmin) => void
  onToggleStatus: (user: UserAdmin) => void
  onUnlock: (user: UserAdmin) => void
  onDelete: (user: UserAdmin) => void
  canEdit: boolean
  canDelete: boolean
}

export function useUsersColumns(options: UseUsersColumnsOptions) {
  const {
    t,
    currentPage,
    pageSize,
    searchTerm,
    onEdit,
    onToggleStatus,
    onUnlock,
    onDelete,
    canEdit,
    canDelete,
  } = options

  return useMemo<ColumnDef<UserAdmin>[]>(() => {
    const cols: ColumnDef<UserAdmin>[] = [
      {
        id: 'rowNumber',
        header: '#',
        size: 50,
        minSize: 40,
        maxSize: 60,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <span className="text-[var(--text-secondary)] tabular-nums">
            {currentPage * pageSize + row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: 'username',
        header: t('Username'),
        size: 200,
        minSize: 140,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5">
            <span className="font-medium text-[var(--text-primary)]">
              <HighlightText text={row.original.username} search={searchTerm} />
            </span>
            {row.original.userType && row.original.userType !== 'UNIVERSITY' && (
              <Badge
                variant="outline"
                className="px-1 py-0 text-[9px] font-normal text-[var(--text-secondary)]"
              >
                {row.original.userType}
              </Badge>
            )}
          </span>
        ),
      },
      {
        accessorKey: 'fullName',
        header: t('Full name'),
        size: 200,
        minSize: 140,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-[var(--text-primary)]">
            <HighlightText text={row.original.fullName ?? ''} search={searchTerm} />
          </span>
        ),
      },
      {
        id: 'roles',
        header: t('Roles'),
        size: 200,
        minSize: 120,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((role) => (
              <Badge
                key={role.id}
                variant={role.roleType === 'SYSTEM' ? 'default' : 'secondary'}
                className="px-1.5 py-0 text-[10px]"
              >
                {role.code}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'enabled',
        header: t('Status'),
        size: 100,
        minSize: 80,
        enableSorting: true,
        cell: ({ row }) => {
          const user = row.original
          if (!user.accountNonLocked) {
            return (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                {t('Locked')}
              </Badge>
            )
          }
          return user.enabled ? (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 px-1.5 py-0 text-[10px] text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400"
            >
              {t('Active')}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-[var(--border-color-pro)] bg-[var(--badge-muted-bg)] px-1.5 py-0 text-[10px] text-[var(--badge-muted-text)]"
            >
              {t('Inactive')}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'universityName',
        header: t('University'),
        size: 200,
        minSize: 120,
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className="truncate text-[var(--text-secondary)]"
            title={row.original.universityName ?? ''}
          >
            {row.original.universityName ?? row.original.universityCode ?? '\u2014'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('Created'),
        size: 130,
        minSize: 100,
        enableSorting: true,
        cell: ({ row }) => {
          const date = row.original.createdAt
          if (!date) return <span className="text-[var(--text-secondary)]">{'\u2014'}</span>
          return (
            <span className="text-xs text-[var(--text-secondary)] tabular-nums">
              {new Intl.DateTimeFormat(i18n.language, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).format(new Date(date))}
            </span>
          )
        },
      },
      {
        accessorKey: 'email',
        header: t('Email'),
        size: 180,
        minSize: 120,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-[var(--text-secondary)]">{row.original.email ?? '\u2014'}</span>
        ),
      },
    ]

    // Actions column (only if user can edit or delete)
    if (canEdit || canDelete) {
      cols.push({
        id: 'actions',
        header: '',
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                  aria-label={t('Actions')}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(user)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    {t('Edit')}
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                    <Power className="mr-2 h-3.5 w-3.5" />
                    {user.enabled ? t('Disable') : t('Enable')}
                  </DropdownMenuItem>
                )}
                {canEdit && !user.accountNonLocked && (
                  <DropdownMenuItem onClick={() => onUnlock(user)}>
                    <LockOpen className="mr-2 h-3.5 w-3.5" />
                    {t('Unlock')}
                  </DropdownMenuItem>
                )}
                {canEdit && canDelete && <DropdownMenuSeparator />}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(user)}
                    className="text-red-600 focus:text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    {t('Delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      })
    }

    return cols
  }, [
    t,
    currentPage,
    pageSize,
    searchTerm,
    onEdit,
    onToggleStatus,
    onUnlock,
    onDelete,
    canEdit,
    canDelete,
  ])
}
