import { useTranslation } from 'react-i18next'
import { Award, Hash, Building2, User, Calendar, Info, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DetailDrawer } from '@/components/DetailDrawer'
import { useCertificateDetail } from '@/hooks/useCertificates'

interface CertificateDetailDrawerProps {
  certificateId: string
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

export default function CertificateDetailDrawer({
  certificateId,
  onClose,
}: CertificateDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: certificate, isLoading, error } = useCertificateDetail(certificateId)

  return (
    <DetailDrawer
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      icon={<Award className="text-primary h-6 w-6" aria-hidden="true" />}
      title={
        isLoading
          ? t('Loading...')
          : certificate?.certificateNameLabel || certificate?.certificateName || t('Certificate')
      }
      description={
        certificate ? `${t('Serial number')}: ${certificate.serialNumber ?? '-'}` : undefined
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
      ) : certificate ? (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
              </div>
              <Badge variant={certificate.active ? 'default' : 'secondary'}>
                {certificate.active ? t('Active') : t('Inactive')}
              </Badge>
            </div>
          </Card>

          <Card className="space-y-4 p-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {t('Basic information')}
            </h3>

            <Field
              icon={<User className="h-4 w-4" />}
              label={t('Student')}
              value={certificate.studentName}
            />
            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                {t('University name')}
              </label>
              <p className="text-base font-medium">{certificate.universityName ?? '-'}</p>
              <p className="text-muted-foreground text-sm">
                {t('University code')}: {certificate.universityCode ?? '-'}
              </p>
            </div>
            <Field
              icon={<Award className="h-4 w-4" />}
              label={t('Certificate type')}
              value={certificate.certificateTypeName || certificate.certificateType}
            />
            <Field
              icon={<Award className="h-4 w-4" />}
              label={t('Certificate name')}
              value={certificate.certificateNameLabel || certificate.certificateName}
            />
            <Field
              icon={<Award className="h-4 w-4" />}
              label={t('Certificate grade')}
              value={certificate.certificateGradeName || certificate.certificateGrade}
            />
            <Field
              icon={<BookOpen className="h-4 w-4" />}
              label={t('Certificate subject')}
              value={certificate.certificateSubjectName || certificate.certificateSubject}
            />
            <Field
              icon={<Hash className="h-4 w-4" />}
              label={t('Serial number')}
              value={certificate.serialNumber}
            />
            <Field
              icon={<Calendar className="h-4 w-4" />}
              label={t('Issue date')}
              value={certificate.issueDate}
            />
            <Field
              icon={<Calendar className="h-4 w-4" />}
              label={t('Valid until')}
              value={certificate.validDate}
            />
          </Card>
        </div>
      ) : null}
    </DetailDrawer>
  )
}
