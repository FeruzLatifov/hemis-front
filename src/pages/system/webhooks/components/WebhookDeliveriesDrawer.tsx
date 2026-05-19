import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useWebhookDeliveries } from '@/hooks/useWebhooks'
import type { WebhookTargetDto, WebhookDeliveryLogDto } from '@/types/webhook.types'

interface Props {
  target: WebhookTargetDto
  onClose: () => void
}

const PAGE_SIZE = 50

export default function WebhookDeliveriesDrawer({ target, onClose }: Props) {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)

  const { data, isLoading } = useWebhookDeliveries(target.id, {
    page,
    size: PAGE_SIZE,
    sort: 'dispatchedAt,desc',
  })

  const items = useMemo(() => data?.content ?? [], [data])
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  const stats = useMemo(() => {
    const s = { success: 0, failed: 0, pending: 0, dlq: 0 }
    items.forEach((d) => {
      const st = (d.status ?? '').toUpperCase()
      if (st === 'SUCCESS') s.success++
      else if (st === 'FAILED') s.failed++
      else if (st === 'DLQ') s.dlq++
      else s.pending++
    })
    return s
  }, [items])

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[820px] max-w-[95vw] overflow-y-auto sm:w-[820px]">
        <SheetHeader>
          <SheetTitle>
            {t('Delivery log')} — OTM {target.universityCode}
          </SheetTitle>
          <SheetDescription className="font-mono text-xs text-slate-500">
            {target.callbackUrl}
          </SheetDescription>
        </SheetHeader>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          <StatBlock label={t('Success')} value={stats.success} tone="emerald" />
          <StatBlock label={t('Failed')} value={stats.failed} tone="red" />
          <StatBlock label={t('DLQ')} value={stats.dlq} tone="amber" />
          <StatBlock label={t('Pending')} value={stats.pending} tone="slate" />
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-medium tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">{t('Status')}</th>
                <th className="px-3 py-2">{t('Event')}</th>
                <th className="px-3 py-2">{t('Attempt')}</th>
                <th className="px-3 py-2">{t('HTTP')}</th>
                <th className="px-3 py-2">{t('Duration')}</th>
                <th className="px-3 py-2">{t('Dispatched')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    {t('No delivery attempts yet')}
                  </td>
                </tr>
              ) : (
                items.map((d) => <DeliveryRow key={d.id} d={d} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
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
      </SheetContent>
    </Sheet>
  )
}

function StatBlock({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'emerald' | 'red' | 'amber' | 'slate'
}) {
  const cls: Record<string, string> = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }
  return (
    <div className={`rounded-lg border p-2 ${cls[tone]}`}>
      <div className="text-[10px] font-medium uppercase opacity-70">{label}</div>
      <div className="mt-0.5 text-base font-semibold">{value}</div>
    </div>
  )
}

function DeliveryRow({ d }: { d: WebhookDeliveryLogDto }) {
  const status = (d.status ?? '').toUpperCase()
  const tone =
    status === 'SUCCESS'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'FAILED'
        ? 'border-red-200 bg-red-50 text-red-700'
        : status === 'DLQ'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-slate-200 bg-slate-50 text-slate-700'

  const httpTone =
    d.httpStatus == null
      ? 'text-slate-400'
      : d.httpStatus >= 200 && d.httpStatus < 300
        ? 'text-emerald-700'
        : d.httpStatus >= 400
          ? 'text-red-700'
          : 'text-slate-700'

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-3 py-2">
        <Badge variant="outline" className={tone}>
          {status || '—'}
        </Badge>
      </td>
      <td className="px-3 py-2">
        <div className="text-xs font-medium">{d.eventType ?? '—'}</div>
        <div className="font-mono text-[11px] text-slate-400">{d.eventId?.slice(0, 8)}…</div>
      </td>
      <td className="px-3 py-2 text-xs text-slate-500">#{d.attemptN ?? 1}</td>
      <td className={`px-3 py-2 text-xs font-medium ${httpTone}`}>{d.httpStatus ?? '—'}</td>
      <td className="px-3 py-2 text-xs text-slate-500">
        {d.durationMs != null ? `${d.durationMs} ms` : '—'}
      </td>
      <td className="px-3 py-2 text-xs text-slate-500">
        {d.dispatchedAt ? new Date(d.dispatchedAt).toLocaleString() : '—'}
      </td>
    </tr>
  )
}
