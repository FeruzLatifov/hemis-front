import { useTranslation } from 'react-i18next'
import {
  Wallet,
  Hash,
  Building2,
  User,
  Calendar,
  Info,
  Layers,
  BadgeDollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DetailDrawer } from '@/components/DetailDrawer'
import { useScholarshipDetail } from '@/hooks/useScholarships'

interface ScholarshipDetailDrawerProps {
  scholarshipId: string
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

export default function ScholarshipDetailDrawer({
  scholarshipId,
  onClose,
}: ScholarshipDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: scholarship, isLoading, error } = useScholarshipDetail(scholarshipId)

  return (
    <DetailDrawer
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      icon={<Wallet className="text-primary h-6 w-6" aria-hidden="true" />}
      title={isLoading ? t('Loading...') : (scholarship?.studentName ?? t('Scholarship'))}
      description={scholarship ? `${t('Decree')}: ${scholarship.decree ?? '-'}` : undefined}
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
      ) : scholarship ? (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
              </div>
              <Badge variant={scholarship.active ? 'default' : 'secondary'}>
                {scholarship.active ? t('Active') : t('Inactive')}
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
              value={scholarship.studentName}
            />
            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                {t('University name')}
              </label>
              <p className="text-base font-medium">{scholarship.universityName ?? '-'}</p>
              <p className="text-muted-foreground text-sm">
                {t('University code')}: {scholarship.universityCode ?? '-'}
              </p>
            </div>
            <Field
              icon={<Layers className="h-4 w-4" />}
              label={t('Scholarship category')}
              value={scholarship.stipendCategory}
            />
            <Field
              icon={<Layers className="h-4 w-4" />}
              label={t('Scholarship type')}
              value={scholarship.stipendType}
            />
            <Field
              icon={<BadgeDollarSign className="h-4 w-4" />}
              label={t('Payment form')}
              value={scholarship.paymentForm}
            />
            <Field
              icon={<Hash className="h-4 w-4" />}
              label={t('Decree')}
              value={scholarship.decree}
            />
            <Field
              icon={<Calendar className="h-4 w-4" />}
              label={t('Education year')}
              value={scholarship.educationYear}
            />
            <Field
              icon={<Info className="h-4 w-4" />}
              label={t('Education type')}
              value={scholarship.educationType}
            />
            <Field
              icon={<Info className="h-4 w-4" />}
              label={t('Semester')}
              value={scholarship.semester ?? scholarship.semesterNumber}
            />
            <Field
              icon={<Calendar className="h-4 w-4" />}
              label={t('Start date')}
              value={scholarship.startDate}
            />
            <Field
              icon={<Calendar className="h-4 w-4" />}
              label={t('End date')}
              value={scholarship.endDate}
            />
          </Card>

          {scholarship.amounts && scholarship.amounts.length > 0 && (
            <Card className="space-y-3 p-4">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                {t('Monthly amounts')}
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color-pro)]">
                    <th className="px-2 py-1.5 text-left text-sm font-medium text-[var(--text-secondary)]">
                      {t('Month')}
                    </th>
                    <th className="px-2 py-1.5 text-right text-sm font-medium text-[var(--text-secondary)]">
                      {t('Amount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scholarship.amounts.map((a, i) => (
                    <tr key={i} className="border-b border-[var(--border-color-pro)]">
                      <td className="px-2 py-1.5 text-sm">{a.month ?? '-'}</td>
                      <td className="px-2 py-1.5 text-right text-sm tabular-nums">
                        {a.amount ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      ) : null}
    </DetailDrawer>
  )
}
