import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import { useErrorLogs } from '@/hooks/useAuditLogs'
import { PAGINATION } from '@/constants'
import type { ErrorLogRow } from '@/types/audit.types'
import { LogDetailDrawer } from './LogDetailDrawer'

interface ErrorLogsTabProps {
  search: string
  dateFrom: string
  dateTo: string
}

export function ErrorLogsTab({ search, dateFrom, dateTo }: ErrorLogsTabProps) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE)
  const [pageSize, setPageSize] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE)
  const [errorType, setErrorType] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      errorType: errorType || undefined,
    }),
    [page, pageSize, search, dateFrom, dateTo, errorType],
  )

  const { data, isLoading, error } = useErrorLogs(params)

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
        <Input
          placeholder={t('Error type')}
          value={errorType}
          onChange={(e) => {
            setErrorType(e.target.value)
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
                <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Error type')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Message')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Endpoint')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-red-500">
                    {t('Failed to load data')}
                  </td>
                </tr>
              ) : !data?.content?.length ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                    {t('No data found')}
                  </td>
                </tr>
              ) : (
                data.content.map((row: ErrorLogRow) => (
                  <tr key={row.id} className="hover:bg-muted/50 border-b">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">{row.username ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.userIp ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                        {row.errorType ?? '-'}
                      </span>
                    </td>
                    <td className="max-w-[250px] truncate px-4 py-3 text-sm">
                      {row.errorMessage ?? '-'}
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
        <LogDetailDrawer id={selectedId} type="error" onClose={() => setSelectedId(null)} />
      )}
    </>
  )
}
