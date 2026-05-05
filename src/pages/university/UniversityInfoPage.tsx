import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUniversityDashboard, useSyncUniversityData } from '@/hooks/useUniversity'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  Users,
  MapPin,
  History,
  Calendar,
  CircleDot,
  Ban,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import type {
  UniversityFounder,
  UniversityLifecycle,
  UniversityCadastre,
} from '@/types/university.types'

// ── Helper Components ──────────────────────────────────────────────────

/** Empty state for tabs with no data */
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hover-bg)]">
        <span className="text-[var(--text-secondary)]">{icon}</span>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">{message}</p>
    </div>
  )
}

/** Format date string to locale display */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014'
  try {
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return dateStr
  }
}

/** Format number with locale grouping */
function formatNumber(value: number | null | undefined): string {
  if (value == null) return '\u2014'
  return value.toLocaleString('uz-UZ')
}

// ── Tab Components ─────────────────────────────────────────────────────

/** Founders Tab */
function FoundersTab({ founders }: { founders: UniversityFounder[] }) {
  const { t } = useTranslation()

  if (founders.length === 0) {
    return <EmptyState icon={<Users className="h-6 w-6" />} message={t('No data available')} />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-color-pro)]">
              <th className="bg-[var(--table-row-alt)] px-4 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                #
              </th>
              <th className="bg-[var(--table-row-alt)] px-4 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                {t('Type')}
              </th>
              <th className="bg-[var(--table-row-alt)] px-4 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                {t('Name')} / {t('TIN')}
              </th>
              <th className="bg-[var(--table-row-alt)] px-4 py-2.5 text-right text-sm font-medium text-[var(--text-secondary)]">
                {t('Share')} %
              </th>
              <th className="bg-[var(--table-row-alt)] px-4 py-2.5 text-right text-sm font-medium text-[var(--text-secondary)]">
                {t('Share sum')}
              </th>
              <th className="bg-[var(--table-row-alt)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text-secondary)]">
                {t('Status')}
              </th>
              <th className="bg-[var(--table-row-alt)] px-4 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                {t('Effective period')}
              </th>
            </tr>
          </thead>
          <tbody>
            {founders.map((founder, index) => (
              <tr
                key={`${founder.founderType}-${founder.tin ?? founder.pinfl ?? index}`}
                className={`border-b border-[var(--border-color-pro)] transition-colors hover:bg-[var(--hover-bg)] ${
                  index % 2 === 1 ? 'bg-[var(--table-row-alt)]' : 'bg-[var(--card-bg)]'
                }`}
              >
                <td className="px-4 py-2.5 text-sm text-[var(--text-secondary)]">{index + 1}</td>
                <td className="px-4 py-2.5 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {founder.founderType === 'individual' ? t('Individual') : t('Legal entity')}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-sm">
                  <div className="font-medium text-[var(--text-primary)]">
                    {founder.name ?? '\u2014'}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {founder.tin ?? founder.pinfl ?? '\u2014'}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-sm text-[var(--text-primary)] tabular-nums">
                  {founder.sharePercent != null ? `${founder.sharePercent}%` : '\u2014'}
                </td>
                <td className="px-4 py-2.5 text-right text-sm text-[var(--text-primary)] tabular-nums">
                  {formatNumber(founder.shareSum)}
                </td>
                <td className="px-4 py-2.5 text-center text-sm">
                  {founder.isCurrent ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t('Current')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-color-pro)] bg-[var(--badge-muted-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--badge-muted-text)]">
                      {t('Former')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-sm text-[var(--text-secondary)]">
                  {formatDate(founder.effectiveFrom)}
                  {founder.effectiveTo ? ` \u2014 ${formatDate(founder.effectiveTo)}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Cadastre Tab */
function CadastreTab({ cadastre }: { cadastre: UniversityCadastre[] }) {
  const { t } = useTranslation()

  if (cadastre.length === 0) {
    return <EmptyState icon={<MapPin className="h-6 w-6" />} message={t('No data available')} />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cadastre.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-5"
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--text-secondary)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {item.cadNumber}
                </span>
              </div>
              {item.shortAddress && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.shortAddress}</p>
              )}
            </div>
            {item.banIs && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                <Ban className="h-3 w-3" />
                {t('Restricted')}
              </span>
            )}
          </div>

          {/* Location */}
          {(item.region || item.district) && (
            <div className="mb-3 text-xs text-[var(--text-secondary)]">
              {[item.region, item.district].filter(Boolean).join(', ')}
            </div>
          )}

          {item.address && (
            <div className="mb-3 text-sm text-[var(--text-primary)]">{item.address}</div>
          )}

          {/* Type info */}
          <div className="mb-3 flex flex-wrap gap-2">
            {item.tipText && (
              <Badge variant="outline" className="text-xs">
                {item.tipText}
              </Badge>
            )}
            {item.vidText && (
              <Badge variant="secondary" className="text-xs">
                {item.vidText}
              </Badge>
            )}
          </div>

          {/* Areas */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--border-color-pro)] bg-[var(--hover-bg)] p-3">
            <div>
              <div className="text-xs text-[var(--text-secondary)]">{t('Land area')}</div>
              <div className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {formatNumber(item.landArea)} {t('sq.m.')}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">{t('Object area')}</div>
              <div className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {formatNumber(item.objectArea)} {t('sq.m.')}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">{t('Living area')}</div>
              <div className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {formatNumber(item.objectAreaL)} {t('sq.m.')}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">{t('Utility area')}</div>
              <div className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {formatNumber(item.objectAreaU)} {t('sq.m.')}
              </div>
            </div>
          </div>

          {/* Cost */}
          {item.cost != null && (
            <div className="mt-3 flex items-center justify-between border-t border-[var(--border-color-pro)] pt-3">
              <span className="text-xs text-[var(--text-secondary)]">{t('Cadastral cost')}</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                {formatNumber(item.cost)} {t('UZS')}
              </span>
            </div>
          )}

          {/* Synced info */}
          {item.syncedAt && (
            <div className="mt-2 text-right text-xs text-[var(--text-secondary)]">
              {t('Synced')}: {formatDate(item.syncedAt)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/** Lifecycle Tab */
function LifecycleTab({ lifecycle }: { lifecycle: UniversityLifecycle[] }) {
  const { t } = useTranslation()

  if (lifecycle.length === 0) {
    return <EmptyState icon={<History className="h-6 w-6" />} message={t('No data available')} />
  }

  /** Map event type to badge styling */
  const getEventBadgeClass = (eventType: string): string => {
    const type = eventType.toLowerCase()
    if (type.includes('create') || type.includes('register')) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400'
    }
    if (type.includes('rename') || type.includes('reorganiz')) {
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400'
    }
    if (type.includes('liquidat') || type.includes('close') || type.includes('delete')) {
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400'
    }
    return 'border-[var(--border-color-pro)] bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)]'
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute top-0 left-6 h-full w-px bg-[var(--border-color-pro)]" />

      <div className="space-y-4">
        {lifecycle.map((event) => (
          <div key={event.id} className="relative flex gap-4 pl-2">
            {/* Timeline dot */}
            <div className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-color-pro)] bg-[var(--card-bg)]">
              <CircleDot className="h-4 w-4 text-[var(--text-secondary)]" />
            </div>

            {/* Content */}
            <div className="flex-1 rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-4">
              {/* Event header */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getEventBadgeClass(event.eventType)}`}
                >
                  {event.eventType}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <Calendar className="h-3 w-3" />
                  {formatDate(event.eventDate)}
                </span>
              </div>

              {/* Name change */}
              {(event.oldName || event.newName) && (
                <div className="mb-2 rounded-lg border border-[var(--border-color-pro)] bg-[var(--hover-bg)] p-3 text-sm">
                  {event.oldName && (
                    <div className="text-[var(--text-secondary)]">
                      <span className="font-medium">{t('From')}:</span> {event.oldName}
                    </div>
                  )}
                  {event.newName && (
                    <div className="text-[var(--text-primary)]">
                      <span className="font-medium">{t('To')}:</span> {event.newName}
                    </div>
                  )}
                </div>
              )}

              {/* Details */}
              <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {event.decreeNumber && (
                  <div>
                    <span className="text-[var(--text-secondary)]">{t('Decree')}:</span>{' '}
                    <span className="font-medium text-[var(--text-primary)]">
                      {event.decreeNumber}
                      {event.decreeDate ? ` (${formatDate(event.decreeDate)})` : ''}
                    </span>
                  </div>
                )}
                {event.successorCode && (
                  <div>
                    <span className="text-[var(--text-secondary)]">{t('Successor')}:</span>{' '}
                    <span className="font-medium text-[var(--text-primary)]">
                      {event.successorCode}
                    </span>
                  </div>
                )}
                {event.studentsCount != null && (
                  <div>
                    <span className="text-[var(--text-secondary)]">{t('Students')}:</span>{' '}
                    <span className="font-medium text-[var(--text-primary)] tabular-nums">
                      {formatNumber(event.studentsCount)}
                    </span>
                  </div>
                )}
                {event.employeesCount != null && (
                  <div>
                    <span className="text-[var(--text-secondary)]">{t('Employees')}:</span>{' '}
                    <span className="font-medium text-[var(--text-primary)] tabular-nums">
                      {formatNumber(event.employeesCount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Note */}
              {event.note && (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{event.note}</p>
              )}

              {/* Footer */}
              <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                {event.createdBy && (
                  <span>
                    {t('Created by')}: {event.createdBy}
                  </span>
                )}
                <span>{formatDate(event.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Loading Skeleton ───────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Header skeleton */}
      <div>
        <Skeleton className="mb-2 h-7 w-72 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-96 rounded-md" />

      {/* Content skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-5"
          >
            <Skeleton className="mb-4 h-5 w-40 rounded" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="grid grid-cols-[180px_1fr] gap-x-4">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-48 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Error State ────────────────────────────────────────────────────────

function ErrorState() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20">
        <Building2 className="h-8 w-8 text-red-400" />
      </div>
      <p className="text-sm font-medium text-[var(--text-primary)]">
        {t('Failed to load university information')}
      </p>
      <p className="text-xs text-[var(--text-secondary)]">{t('Please try again later')}</p>
    </div>
  )
}

// ── Main Page Component ────────────────────────────────────────────────

export default function UniversityInfoPage() {
  const { code } = useParams<{ code: string }>()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('founders')

  const { data: dashboard, isLoading, isError } = useUniversityDashboard(code ?? '')
  const syncMutation = useSyncUniversityData(code ?? '')

  if (isLoading) return <PageSkeleton />

  if (isError) return <ErrorState />

  const hasData = (dashboard?.founders?.length ?? 0) > 0 || (dashboard?.cadastre?.length ?? 0) > 0

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              {t('University Information')}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('Code')}: {code}
            </p>
          </div>
        </div>
        <Button
          variant={hasData ? 'outline' : 'default'}
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {syncMutation.isPending ? t('Syncing...') : t('Sync external data')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="founders" className="gap-1.5">
            <Users className="h-4 w-4" />
            {t('Founders')}
          </TabsTrigger>
          <TabsTrigger value="cadastre" className="gap-1.5">
            <MapPin className="h-4 w-4" />
            {t('Cadastre')}
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="gap-1.5">
            <History className="h-4 w-4" />
            {t('Lifecycle')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="founders" className="mt-4">
          <FoundersTab founders={dashboard?.founders ?? []} />
        </TabsContent>

        <TabsContent value="cadastre" className="mt-4">
          <CadastreTab cadastre={dashboard?.cadastre ?? []} />
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-4">
          <LifecycleTab lifecycle={dashboard?.lifecycle ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
