import { useTranslation } from 'react-i18next'
import {
  BookMarked,
  Hash,
  Building2,
  Users,
  Calendar,
  Info,
  FileText,
  Database,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DetailDrawer } from '@/components/DetailDrawer'
import { usePublicationDetail } from '@/hooks/usePublications'

interface PublicationDetailDrawerProps {
  publicationId: string
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
      <p className="text-base font-medium">{value ?? '-'}</p>
    </div>
  )
}

export default function PublicationDetailDrawer({
  publicationId,
  onClose,
}: PublicationDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: publication, isLoading, error } = usePublicationDetail(publicationId)

  return (
    <DetailDrawer
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      icon={<BookMarked className="text-primary h-6 w-6" aria-hidden="true" />}
      title={isLoading ? t('Loading...') : (publication?.name ?? t('Publication'))}
      description={publication ? `${t('Authors')}: ${publication.authors ?? '-'}` : undefined}
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
      ) : publication ? (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
              </div>
              <Badge variant={publication.active ? 'default' : 'secondary'}>
                {publication.active ? t('Active') : t('Inactive')}
              </Badge>
            </div>
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {t('Basic information')}
            </h3>

            <Field
              icon={<FileText className="h-4 w-4" />}
              label={t('Name')}
              value={publication.name}
            />
            <Field
              icon={<Users className="h-4 w-4" />}
              label={t('Authors')}
              value={publication.authors}
            />
            <Field
              icon={<Users className="h-4 w-4" />}
              label={t('Author count')}
              value={publication.authorCounts}
            />
            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                {t('University name')}
              </label>
              <p className="text-base font-medium">{publication.universityName ?? '-'}</p>
              <p className="text-muted-foreground text-sm">
                {t('University code')}: {publication.universityCode ?? '-'}
              </p>
            </div>
            <Field
              icon={<FileText className="h-4 w-4" />}
              label={t('Source')}
              value={publication.sourceName}
            />
            <Field
              icon={<Calendar className="h-4 w-4" />}
              label={t('Issue year')}
              value={publication.issueYear}
            />
            <Field
              icon={<Info className="h-4 w-4" />}
              label={t('Publication type')}
              value={publication.publicationTypeName}
            />
            <Field icon={<Link2 className="h-4 w-4" />} label={t('DOI')} value={publication.doi} />
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {t('Publication type')}
            </h3>
            <Field
              icon={<Hash className="h-4 w-4" />}
              label={t('Keywords')}
              value={publication.keywords}
            />
            <Field
              icon={<Info className="h-4 w-4" />}
              label={t('Parameter')}
              value={publication.parameter}
            />
            <Field
              icon={<Database className="h-4 w-4" />}
              label={t('Publication database')}
              value={publication.publicationDatabaseName}
            />
            <Field
              icon={<Calendar className="h-4 w-4" />}
              label={t('Education year')}
              value={publication.educationYear}
            />
            <Field
              icon={<Info className="h-4 w-4" />}
              label={t('Checked')}
              value={publication.isChecked ? t('Active') : t('Inactive')}
            />
          </Card>
        </div>
      ) : null}
    </DetailDrawer>
  )
}
