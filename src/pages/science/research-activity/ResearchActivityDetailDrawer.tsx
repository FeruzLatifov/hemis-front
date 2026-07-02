import { useTranslation } from 'react-i18next'
import {
  X,
  FlaskConical,
  Building2,
  Calendar,
  Database,
  Hash,
  FileText,
  Quote,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useResearchActivityDetail } from '@/hooks/useResearchActivity'

interface ResearchActivityDetailDrawerProps {
  activityId: string
  onClose: () => void
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
}) {
  return (
    <div>
      <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </label>
      <p className="text-base font-medium break-all">{value ?? '-'}</p>
    </div>
  )
}

export default function ResearchActivityDetailDrawer({
  activityId,
  onClose,
}: ResearchActivityDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: activity, isLoading, error } = useResearchActivityDetail(activityId)

  return (
    <div
      role="button"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div className="bg-background h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--border-color-pro)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] duration-300">
        <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <FlaskConical className="text-primary h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? <Skeleton className="h-6 w-48" /> : activity?.universityName}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLoading ? (
                  <Skeleton className="mt-1 h-4 w-32" />
                ) : (
                  `${t('Scholar database')}: ${activity?.scholarDatabaseName ?? '-'}`
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
            {t('Close')}
          </Button>
        </div>

        <div className="space-y-6 p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="mb-2 h-5 w-32" />
                  <Skeleton className="h-6 w-full" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/20">
              <p className="text-red-600">
                {t('Failed to load data')}:{' '}
                {error instanceof Error ? error.message : t('Unknown error')}
              </p>
            </Card>
          ) : activity ? (
            <Card className="space-y-4 p-4">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                {t('Basic information')}
              </h3>

              <div>
                <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  {t('University name')}
                </label>
                <p className="text-base font-medium">{activity.universityName ?? '-'}</p>
                <p className="text-muted-foreground text-sm">
                  {t('University code')}: {activity.universityCode ?? '-'}
                </p>
              </div>
              <Field
                icon={<Calendar className="h-4 w-4" />}
                label={t('Education year')}
                value={activity.educationYear}
              />
              <Field
                icon={<Database className="h-4 w-4" />}
                label={t('Scholar database')}
                value={activity.scholarDatabaseName}
              />
              <Field
                icon={<Hash className="h-4 w-4" />}
                label={t('H-index')}
                value={activity.hIndex}
              />
              <Field
                icon={<FileText className="h-4 w-4" />}
                label={t('Scientific work count')}
                value={activity.scientificWorkCount}
              />
              <Field
                icon={<Quote className="h-4 w-4" />}
                label={t('Reference count')}
                value={activity.referenceCount}
              />
              <Field icon={<Link2 className="h-4 w-4" />} label={t('Link')} value={activity.link} />
            </Card>
          ) : null}
        </div>

        <div className="bg-background sticky bottom-0 border-t px-6 py-4">
          <Button onClick={onClose} className="w-full">
            {t('Close')}
          </Button>
        </div>
      </div>
    </div>
  )
}
