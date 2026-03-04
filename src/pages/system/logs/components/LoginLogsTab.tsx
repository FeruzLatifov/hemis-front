import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useLoginLogs } from '@/hooks/useAuditLogs'
import { PAGINATION } from '@/constants'
import type { LoginEventType, LoginLogRow } from '@/types/audit.types'

const EVENT_COLORS: Record<LoginEventType, string> = {
  LOGIN_SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
  LOGIN_FAILED: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
  LOGOUT: 'bg-muted text-foreground',
  TOKEN_REFRESH: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  SESSION_EXPIRED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400',
}

const EVENT_LABELS: Record<LoginEventType, string> = {
  LOGIN_SUCCESS: 'Success',
  LOGIN_FAILED: 'Failed',
  LOGOUT: 'Logout',
  TOKEN_REFRESH: 'Refresh',
  SESSION_EXPIRED: 'Expired',
}

const EVENT_TYPES: LoginEventType[] = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'TOKEN_REFRESH',
  'SESSION_EXPIRED',
]

interface LoginLogsTabProps {
  search: string
  dateFrom: string
  dateTo: string
}

export function LoginLogsTab({ search, dateFrom, dateTo }: LoginLogsTabProps) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE)
  const [pageSize, setPageSize] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE)
  const [eventType, setEventType] = useState<string>('all')

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      eventType: eventType !== 'all' ? (eventType as LoginEventType) : undefined,
    }),
    [page, pageSize, search, dateFrom, dateTo, eventType],
  )

  const { data, isLoading, error } = useLoginLogs(params)

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
          value={eventType}
          onValueChange={(val) => {
            setEventType(val)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('Event type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All events')}</SelectItem>
            {EVENT_TYPES.map((et) => (
              <SelectItem key={et} value={et}>
                {EVENT_LABELS[et]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Created at')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Username')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Event')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Failure reason')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                    {t('Failed to load data')}
                  </td>
                </tr>
              ) : !data?.content?.length ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                    {t('No data found')}
                  </td>
                </tr>
              ) : (
                data.content.map((row: LoginLogRow) => (
                  <tr key={row.id} className="hover:bg-muted/50 border-b">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">{row.username}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.userIp ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${EVENT_COLORS[row.eventType]}`}
                      >
                        {EVENT_LABELS[row.eventType]}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm">
                      {row.failureReason ?? '-'}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-xs">
                      {row.userAgent ?? '-'}
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
    </>
  )
}
