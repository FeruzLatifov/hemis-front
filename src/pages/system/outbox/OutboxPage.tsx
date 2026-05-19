import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  RefreshCw,
  Eye,
  RotateCcw,
  Ban,
  AlertTriangle,
  Inbox,
  CheckCircle,
  Clock,
  PlayCircle,
} from 'lucide-react'
import { useOutboxList, useOutboxStats, useOutboxRetry, useOutboxDiscard } from '@/hooks/useOutbox'
import { useAuthStore } from '@/stores/authStore'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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
import type { OutboxEventDto } from '@/types/outbox.types'
import OutboxEventDrawer from './components/OutboxEventDrawer'

type DialogState =
  | { type: 'idle' }
  | { type: 'detail'; event: OutboxEventDto }
  | { type: 'retry'; event: OutboxEventDto }
  | { type: 'discard'; event: OutboxEventDto }

const STATUS_FILTERS = ['all', 'PENDING', 'RETRYING', 'DLQ', 'PUBLISHED']
const AGGREGATE_TYPES = ['all', 'employee', 'employee_job', 'classifier', 'webhook', 'university']
const PAGE_SIZE = 25

export default function OutboxPage() {
  const { t } = useTranslation()
  const { permissions } = useAuthStore()

  const canView = permissions.includes('outbox.view')
  const canManage = permissions.includes('outbox.manage')

  const [searchParams, setSearchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all')
  const [aggregateFilter, setAggregateFilter] = useState(
    () => searchParams.get('aggregateType') || 'all',
  )
  const [page, setPage] = useState(0)

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (statusFilter === 'all') next.delete('status')
    else next.set('status', statusFilter)
    if (aggregateFilter === 'all') next.delete('aggregateType')
    else next.set('aggregateType', aggregateFilter)
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, aggregateFilter])
  const [discardReason, setDiscardReason] = useState('')
  const [dialog, setDialog] = useState<DialogState>({ type: 'idle' })
  const closeDialog = useCallback(() => {
    setDialog({ type: 'idle' })
    setDiscardReason('')
  }, [])

  const listParams = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : statusFilter,
      aggregateType: aggregateFilter === 'all' ? undefined : aggregateFilter,
      page,
      size: PAGE_SIZE,
      sort: 'occurredAt,desc',
    }),
    [statusFilter, aggregateFilter, page],
  )

  const { data: pagedData, isLoading, refetch, isFetching } = useOutboxList(listParams)
  const { data: stats } = useOutboxStats()
  const retryMutation = useOutboxRetry()
  const discardMutation = useOutboxDiscard()

  const rows = pagedData?.content ?? []
  const totalPages = pagedData?.totalPages ?? 0
  const totalElements = pagedData?.totalElements ?? 0

  if (!canView) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        {t('You do not have permission to view this page')}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('Outbox Queue')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('Inspect pending events, retry failures, discard poison pills.')}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {t('Refresh')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard
          icon={<Inbox className="h-4 w-4" />}
          label={t('Total')}
          value={stats?.total ?? 0}
          tone="slate"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label={t('Pending')}
          value={stats?.pending ?? 0}
          tone="amber"
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4" />}
          label={t('Published')}
          value={stats?.published ?? 0}
          tone="emerald"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label={t('DLQ')}
          value={stats?.dlq ?? 0}
          tone="red"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label={t('Oldest pending')}
          value={stats?.oldestPendingMinutes ?? 0}
          suffix={t('min')}
          tone={(stats?.oldestPendingMinutes ?? 0) > 15 ? 'red' : 'slate'}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('Status')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? t('All statuses') : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={aggregateFilter}
          onValueChange={(v) => {
            setAggregateFilter(v)
            setPage(0)
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('Aggregate type')} />
          </SelectTrigger>
          <SelectContent>
            {AGGREGATE_TYPES.map((a) => (
              <SelectItem key={a} value={a}>
                {a === 'all' ? t('All aggregates') : a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">{t('Status')}</th>
              <th className="px-4 py-3">{t('Aggregate')}</th>
              <th className="px-4 py-3">{t('Event type')}</th>
              <th className="px-4 py-3">{t('Topic')}</th>
              <th className="px-4 py-3">{t('Retry')}</th>
              <th className="px-4 py-3">{t('Occurred')}</th>
              <th className="px-4 py-3 text-right">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  {t('No outbox events match the current filters')}
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <OutboxRow
                  key={e.id}
                  event={e}
                  canManage={canManage}
                  onInspect={() => setDialog({ type: 'detail', event: e })}
                  onRetry={() => setDialog({ type: 'retry', event: e })}
                  onDiscard={() => setDialog({ type: 'discard', event: e })}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {t('Showing page {{cur}} of {{total}} ({{count}} total)', {
              cur: page + 1,
              total: totalPages,
              count: totalElements,
            })}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 disabled:opacity-40"
            >
              {t('Prev')}
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 disabled:opacity-40"
            >
              {t('Next')}
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {dialog.type === 'detail' && (
        <OutboxEventDrawer eventId={dialog.event.id} onClose={closeDialog} />
      )}

      {/* Retry confirm */}
      <AlertDialog open={dialog.type === 'retry'} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Re-queue this event?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Retry count will be reset to 0 so the next OutboxPoller cycle will pick it up and try Kafka publish again.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={retryMutation.isPending}
              onClick={() => {
                if (dialog.type === 'retry') {
                  retryMutation.mutate(dialog.event.id, { onSuccess: closeDialog })
                }
              }}
            >
              {t('Re-queue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard confirm */}
      <AlertDialog open={dialog.type === 'discard'} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Discard this event?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Event will be marked published_at=now without sending to Kafka. Use for poison pills or obsolete events.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 px-1">
            <Input
              placeholder={t('Reason (optional)')}
              value={discardReason}
              onChange={(e) => setDiscardReason(e.target.value)}
              maxLength={255}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={discardMutation.isPending}
              onClick={() => {
                if (dialog.type === 'discard') {
                  discardMutation.mutate(
                    { id: dialog.event.id, reason: discardReason || undefined },
                    { onSuccess: closeDialog },
                  )
                }
              }}
            >
              {t('Discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  tone: 'slate' | 'emerald' | 'amber' | 'red'
}) {
  const cls: Record<string, string> = {
    slate: 'border-slate-200 text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  }
  return (
    <div className={`rounded-lg border bg-white p-3 ${cls[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase opacity-70">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold">
        {Math.round(value)}
        {suffix && <span className="ml-1 text-xs font-medium opacity-60">{suffix}</span>}
      </div>
    </div>
  )
}

function OutboxRow({
  event: e,
  canManage,
  onInspect,
  onRetry,
  onDiscard,
}: {
  event: OutboxEventDto
  canManage: boolean
  onInspect: () => void
  onRetry: () => void
  onDiscard: () => void
}) {
  const { t } = useTranslation()
  const status = (e.status ?? '').toUpperCase()
  const tone =
    status === 'PUBLISHED'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'DLQ'
        ? 'border-red-200 bg-red-50 text-red-700'
        : status === 'RETRYING'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-slate-200 bg-slate-50 text-slate-700'

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <Badge variant="outline" className={tone}>
          {status || '—'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{e.aggregateType}</div>
        <div className="font-mono text-[11px] text-slate-400">
          {e.aggregateId.length > 30 ? `${e.aggregateId.slice(0, 30)}…` : e.aggregateId}
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-medium text-slate-600">{e.eventType}</td>
      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
        <span className="block max-w-xs truncate" title={e.topic ?? ''}>
          {e.topic ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs">
        <span className={(e.retryCount ?? 0) > 0 ? 'font-medium text-amber-600' : 'text-slate-500'}>
          {e.retryCount ?? 0}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {e.occurredAt ? new Date(e.occurredAt).toLocaleString() : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <IconButton title={t('Inspect')} onClick={onInspect}>
            <Eye className="h-4 w-4" />
          </IconButton>
          {canManage && (status === 'DLQ' || status === 'RETRYING') && (
            <IconButton title={t('Re-queue')} onClick={onRetry}>
              <RotateCcw className="h-4 w-4" />
            </IconButton>
          )}
          {canManage && status !== 'PUBLISHED' && (
            <IconButton title={t('Discard')} tone="danger" onClick={onDiscard}>
              <Ban className="h-4 w-4" />
            </IconButton>
          )}
        </div>
      </td>
    </tr>
  )
}

function IconButton({
  children,
  onClick,
  title,
  disabled,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  disabled?: boolean
  tone?: 'default' | 'danger'
}) {
  const cls =
    tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100'
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded ${cls} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  )
}

// Unused import guard (PlayCircle reserved for future "publish-now" action)
void PlayCircle
