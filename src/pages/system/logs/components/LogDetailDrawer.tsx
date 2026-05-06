import { useTranslation } from 'react-i18next'
import { X, Activity, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useActivityDetail, useErrorDetail } from '@/hooks/useAuditLogs'
import type { AuditAction } from '@/types/audit.types'

const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
  VIEW: 'bg-muted text-foreground',
  EXPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
  IMPORT: 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400',
}

interface LogDetailDrawerProps {
  id: string
  type: 'activity' | 'error'
  onClose: () => void
}

function ActivityDetail({ id }: { id: string }) {
  const { t, i18n } = useTranslation()
  const { data, isLoading, error } = useActivityDetail(id)

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-6 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/30">
        <p className="text-red-600">
          {t('Failed to load data')}: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Action & Entity */}
      <Card className="space-y-3 p-4">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          {t('Audit information')}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{t('Action')}:</span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ACTION_COLORS[data.action]}`}
          >
            {data.action}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground text-sm">{t('Entity')}:</span>{' '}
          <span className="text-sm font-medium">{data.entityType}</span>
          {data.entityId && (
            <span className="text-muted-foreground text-sm"> ({data.entityId})</span>
          )}
        </div>
        {data.entityName && (
          <div>
            <span className="text-muted-foreground text-sm">{t('Name')}:</span>{' '}
            <span className="text-sm font-medium">{data.entityName}</span>
          </div>
        )}
        {data.description && (
          <div>
            <span className="text-muted-foreground text-sm">{t('Description')}:</span>{' '}
            <span className="text-sm">{data.description}</span>
          </div>
        )}
      </Card>

      {/* User info */}
      <Card className="space-y-3 p-4">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          {t('User information')}
        </h3>
        <div>
          <span className="text-muted-foreground text-sm">{t('Username')}:</span>{' '}
          <span className="text-sm font-medium">{data.username ?? '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-sm">{t('Full name')}:</span>{' '}
          <span className="text-sm font-medium">{data.fullName ?? '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-sm">IP:</span>{' '}
          <span className="text-sm font-medium">{data.userIp ?? '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-sm">{t('Created at')}:</span>{' '}
          <span className="text-sm">{formatDate(data.createdAt)}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-sm">{t('Endpoint')}:</span>{' '}
          <span className="font-mono text-xs break-all">{data.endpoint ?? '-'}</span>
        </div>
      </Card>

      {/* Changed Fields */}
      {data.changedFields && data.changedFields.length > 0 && (
        <Card className="space-y-3 p-4">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {t('Changed fields')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {data.changedFields.map((field) => (
              <Badge key={field} variant="secondary">
                {field}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Old / New values */}
      {data.oldValue && (
        <Card className="space-y-2 p-4">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {t('Old value')}
          </h3>
          <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
            {JSON.stringify(data.oldValue, null, 2)}
          </pre>
        </Card>
      )}
      {data.newValue && (
        <Card className="space-y-2 p-4">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {t('New value')}
          </h3>
          <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
            {JSON.stringify(data.newValue, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}

function ErrorDetail({ id }: { id: string }) {
  const { t, i18n } = useTranslation()
  const { data, isLoading, error } = useErrorDetail(id)

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-6 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/30">
        <p className="text-red-600">
          {t('Failed to load data')}: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Error info */}
      <Card className="space-y-3 p-4">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          {t('Error details')}
        </h3>
        <div>
          <span className="text-muted-foreground text-sm">{t('Error type')}:</span>{' '}
          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/30 dark:text-red-400">
            {data.errorType ?? '-'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground text-sm">{t('Message')}:</span>{' '}
          <span className="text-sm">{data.errorMessage ?? '-'}</span>
        </div>
      </Card>

      {/* User info */}
      <Card className="space-y-3 p-4">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          {t('User information')}
        </h3>
        <div>
          <span className="text-muted-foreground text-sm">{t('Username')}:</span>{' '}
          <span className="text-sm font-medium">{data.username ?? '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-sm">IP:</span>{' '}
          <span className="text-sm font-medium">{data.userIp ?? '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-sm">{t('Created at')}:</span>{' '}
          <span className="text-sm">{formatDate(data.createdAt)}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-sm">{t('Endpoint')}:</span>{' '}
          <span className="font-mono text-xs break-all">{data.endpoint ?? '-'}</span>
        </div>
      </Card>

      {/* Stack trace */}
      {data.stackTrace && (
        <Card className="space-y-2 p-4">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Stack Trace
          </h3>
          <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
            {data.stackTrace}
          </pre>
        </Card>
      )}

      {/* Request body */}
      {data.requestBody && (
        <Card className="space-y-2 p-4">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Request Body
          </h3>
          <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
            {JSON.stringify(data.requestBody, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}

export function LogDetailDrawer({ id, type, onClose }: LogDetailDrawerProps) {
  const { t } = useTranslation()

  return (
    <div
      role="button"
      tabIndex={0}
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-end bg-black/50 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div className="bg-background animate-in slide-in-from-right h-full w-full max-w-2xl overflow-y-auto shadow-2xl duration-300">
        {/* Header */}
        <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            {type === 'activity' ? (
              <Activity className="text-primary h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-500" />
            )}
            <h2 className="text-xl font-semibold">
              {type === 'activity' ? t('Activity details') : t('Error details')}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('Close')}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {type === 'activity' ? <ActivityDetail id={id} /> : <ErrorDetail id={id} />}
        </div>

        {/* Footer */}
        <div className="bg-background sticky bottom-0 border-t px-6 py-4">
          <Button onClick={onClose} className="w-full">
            {t('Close')}
          </Button>
        </div>
      </div>
    </div>
  )
}
