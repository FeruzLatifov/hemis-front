import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useOutboxEvent } from '@/hooks/useOutbox'

interface Props {
  eventId: string
  onClose: () => void
}

export default function OutboxEventDrawer({ eventId, onClose }: Props) {
  const { t } = useTranslation()
  const { data: e, isLoading } = useOutboxEvent(eventId)

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[720px] max-w-[95vw] overflow-y-auto sm:w-[720px]">
        <SheetHeader>
          <SheetTitle>{t('Outbox event')}</SheetTitle>
          <SheetDescription className="font-mono text-xs text-slate-500">
            {eventId}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-3 px-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !e ? (
          <div className="mt-6 px-6 text-sm text-slate-500">{t('Event not found')}</div>
        ) : (
          <div className="mt-4 space-y-4 px-6 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                {e.status}
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                {e.aggregateType}
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                {e.eventType}
              </Badge>
              {e.retryCount != null && e.retryCount > 0 && (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  {t('Retry')}: {e.retryCount}
                </Badge>
              )}
            </div>

            <Section title={t('Routing')}>
              <Row label={t('Topic')} value={e.topic} mono />
              <Row label={t('Schema version')} value={e.schemaVersion?.toString() ?? '—'} />
              <Row label={t('Aggregate ID')} value={e.aggregateId} mono />
              <Row label={t('Correlation ID')} value={e.correlationId ?? '—'} mono />
              <Row label={t('Causation ID')} value={e.causationId ?? '—'} mono />
              <Row label={t('Created by')} value={e.createdBy ?? '—'} />
            </Section>

            <Section title={t('Timeline')}>
              <Row
                label={t('Occurred')}
                value={e.occurredAt ? new Date(e.occurredAt).toLocaleString() : '—'}
              />
              <Row
                label={t('Published')}
                value={e.publishedAt ? new Date(e.publishedAt).toLocaleString() : t('Not yet')}
              />
            </Section>

            {e.lastError && (
              <Section title={t('Last error')}>
                <pre className="overflow-x-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {e.lastError}
                </pre>
              </Section>
            )}

            <Section title={t('Payload')}>
              <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800">
                {tryFormatJson(e.payloadPreview)}
              </pre>
            </Section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={mono ? 'font-mono text-xs break-all text-slate-700' : 'text-slate-700'}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function tryFormatJson(s: string | null): string {
  if (!s) return '—'
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}
