import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye } from 'lucide-react'
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
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import { useActivityLogs } from '@/hooks/useAuditLogs'
import { PAGINATION } from '@/constants'
import type { AuditAction, ActivityLogRow } from '@/types/audit.types'
import { LogDetailDrawer } from './LogDetailDrawer'

const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
  VIEW: 'bg-muted text-foreground',
  EXPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
  IMPORT: 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400',
}

const ACTIONS: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT']

interface ActivityLogsTabProps {
  search: string
  dateFrom: string
  dateTo: string
}

export function ActivityLogsTab({ search, dateFrom, dateTo }: ActivityLogsTabProps) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE)
  const [pageSize, setPageSize] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE)
  const [action, setAction] = useState<string>('all')
  const [entityType, setEntityType] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      action: action !== 'all' ? (action as AuditAction) : undefined,
      entityType: entityType || undefined,
    }),
    [page, pageSize, search, dateFrom, dateTo, action, entityType],
  )

  const { data, isLoading, error } = useActivityLogs(params)

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 py-4">
        <Select
          value={action}
          onValueChange={(val) => {
            setAction(val)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('Action')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All actions')}</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder={t('Entity type')}
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value)
            setPage(0)
          }}
          className="w-[200px]"
        />
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Created at')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Username')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Full name')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Action')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Entity')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Endpoint')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-red-500">
                    {t('Failed to load data')}
                  </td>
                </tr>
              ) : !data?.content?.length ? (
                <tr>
                  <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center">
                    {t('No data found')}
                  </td>
                </tr>
              ) : (
                data.content.map((row: ActivityLogRow) => (
                  <tr key={row.id} className="hover:bg-muted/50 border-b">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">{row.username ?? '-'}</td>
                    <td className="px-4 py-3 text-sm">{row.fullName ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.userIp ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_COLORS[row.action]}`}
                      >
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {row.entityType ?? '-'}
                      {row.entityId && (
                        <span className="text-muted-foreground ml-1 text-xs">({row.entityId})</span>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs">
                      {row.endpoint ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedId(row.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && (
          <DataTablePagination
            page={page}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(0)
            }}
          />
        )}
      </Card>

      {selectedId && (
        <LogDetailDrawer id={selectedId} type="activity" onClose={() => setSelectedId(null)} />
      )}
    </>
  )
}
