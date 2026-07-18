import { useTranslation } from 'react-i18next'
import {
  BookCopy,
  Building2,
  Users,
  Calendar,
  Info,
  FileText,
  Database,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DetailDrawer } from '@/components/DetailDrawer'
import { useMethodicalDetail } from '@/hooks/useMethodical'

interface MethodicalDetailDrawerProps {
  methodicalId: string
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

export default function MethodicalDetailDrawer({
  methodicalId,
  onClose,
}: MethodicalDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: methodical, isLoading, error } = useMethodicalDetail(methodicalId)

  return (
    <DetailDrawer
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      icon={<BookCopy className="text-primary h-6 w-6" aria-hidden="true" />}
      title={isLoading ? t('Loading...') : (methodical?.name ?? t('Methodical'))}
      description={methodical ? `${t('Authors')}: ${methodical.authors ?? '-'}` : undefined}
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
      ) : methodical ? (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
              </div>
              <Badge variant={methodical.active ? 'default' : 'secondary'}>
                {methodical.active ? t('Active') : t('Inactive')}
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
              value={methodical.name}
            />
            <Field
              icon={<Users className="h-4 w-4" />}
              label={t('Authors')}
              value={methodical.authors}
            />
            <Field
              icon={<Users className="h-4 w-4" />}
              label={t('Author count')}
              value={methodical.authorCounts}
            />
            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                {t('University name')}
              </label>
              <p className="text-base font-medium">{methodical.universityName ?? '-'}</p>
              <p className="text-muted-foreground text-sm">
                {t('University code')}: {methodical.universityCode ?? '-'}
              </p>
            </div>
            <Field
              icon={<Printer className="h-4 w-4" />}
              label={t('Publisher')}
              value={methodical.publisher}
            />
            <Field
              icon={<FileText className="h-4 w-4" />}
              label={t('Source')}
              value={methodical.sourceName}
            />
            <Field
              icon={<Calendar className="h-4 w-4" />}
              label={t('Issue year')}
              value={methodical.issueYear}
            />
            <Field
              icon={<Info className="h-4 w-4" />}
              label={t('Type')}
              value={methodical.methodicalTypeName}
            />
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {t('Type')}
            </h3>
            <Field
              icon={<Info className="h-4 w-4" />}
              label={t('Parameter')}
              value={methodical.parameter}
            />
            <Field
              icon={<Database className="h-4 w-4" />}
              label={t('Publication database')}
              value={methodical.publicationDatabaseName}
            />
            <Field
              icon={<Calendar className="h-4 w-4" />}
              label={t('Education year')}
              value={methodical.educationYear}
            />
            <Field
              icon={<Info className="h-4 w-4" />}
              label={t('Checked')}
              value={methodical.isChecked ? t('Active') : t('Inactive')}
            />
          </Card>
        </div>
      ) : null}
    </DetailDrawer>
  )
}
