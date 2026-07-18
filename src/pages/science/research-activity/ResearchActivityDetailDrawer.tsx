import { useTranslation } from 'react-i18next'
import {
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
import { DetailDrawer } from '@/components/DetailDrawer'
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
    <DetailDrawer
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      icon={<FlaskConical className="text-primary h-6 w-6" aria-hidden="true" />}
      title={isLoading ? t('Loading...') : (activity?.universityName ?? t('Research activity'))}
      description={
        activity ? `${t('Scholar database')}: ${activity.scholarDatabaseName ?? '-'}` : undefined
      }
      footer={
        <Button onClick={onClose} className="w-full">
          {t('Close')}
        </Button>
      }
    >
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
          <p className="text-red-600 dark:text-red-400">
            {t('Failed to load data')}:{' '}
            {error instanceof Error ? error.message : t('Unknown error')}
          </p>
        </Card>
      ) : activity ? (
        <div className="space-y-6">
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
        </div>
      ) : null}
    </DetailDrawer>
  )
}
