import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import i18n from '@/i18n/config'
import type { RoleAdmin } from '@/types/role.types'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, Pencil } from 'lucide-react'
import { HighlightText } from './roles-cells'

interface UseRolesColumnsOptions {
  t: (key: string) => string
  currentPage: number
  pageSize: number
  searchTerm: string
  onEdit: (role: RoleAdmin) => void
  onDelete: (role: RoleAdmin) => void
  canManage: boolean
}

export function useRolesColumns(options: UseRolesColumnsOptions) {
  const { t, currentPage, pageSize, searchTerm, onEdit, onDelete, canManage } = options

  return useMemo<ColumnDef<RoleAdmin>[]>(() => {
    const cols: ColumnDef<RoleAdmin>[] = [
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
        accessorKey: 'code',
        header: t('Code'),
        size: 180,
        minSize: 120,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium text-[var(--text-primary)]">
            <HighlightText text={row.original.code} search={searchTerm} />
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('Name'),
        size: 220,
        minSize: 140,
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-[var(--text-primary)]">
            <HighlightText text={row.original.name} search={searchTerm} />
          </span>
        ),
      },
      {
        accessorKey: 'roleType',
        header: t('Type'),
        size: 120,
        minSize: 80,
        enableSorting: true,
        cell: ({ row }) => {
          const roleType = row.original.roleType
          return (
            <Badge
              variant={
                roleType === 'SYSTEM'
                  ? 'default'
                  : roleType === 'UNIVERSITY'
                    ? 'secondary'
                    : 'outline'
              }
              className="px-1.5 py-0 text-[10px]"
            >
              {roleType}
            </Badge>
          )
        },
      },
      {
        id: 'permissionsCount',
        header: t('Permissions'),
        size: 110,
        minSize: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-[var(--text-secondary)] tabular-nums">
            {row.original.permissions.length}
          </span>
        ),
      },
      {
        id: 'usersCount',
        header: t('Users'),
        size: 80,
        minSize: 60,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-[var(--text-secondary)] tabular-nums">
            {row.original.usersCount}
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
    ]

    if (canManage) {
      cols.push({
        id: 'actions',
        header: '',
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const role = row.original
          const isSystem = role.roleType === 'SYSTEM'
          if (isSystem) return null

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
                <DropdownMenuItem onClick={() => onEdit(role)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  {t('Edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(role)}
                  disabled={role.usersCount > 0}
                  className="text-red-600 focus:text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  {t('Delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      })
    }

    return cols
  }, [t, currentPage, pageSize, searchTerm, onEdit, onDelete, canManage])
}
