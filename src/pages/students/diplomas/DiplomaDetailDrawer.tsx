import { useTranslation } from 'react-i18next'
import {
  X,
  GraduationCap,
  Hash,
  Building2,
  User,
  Calendar,
  Info,
  Award,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useDiplomaDetail } from '@/hooks/useDiplomas'

interface DiplomaDetailDrawerProps {
  diplomaId: string
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

export default function DiplomaDetailDrawer({ diplomaId, onClose }: DiplomaDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: diploma, isLoading, error } = useDiplomaDetail(diplomaId)

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
            <GraduationCap className="text-primary h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? <Skeleton className="h-6 w-48" /> : diploma?.diplomaNumber}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLoading ? (
                  <Skeleton className="mt-1 h-4 w-32" />
                ) : (
                  `${t('Register number')}: ${diploma?.registerNumber ?? '-'}`
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
          ) : diploma ? (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
                  </div>
                  <Badge variant={diploma.active ? 'default' : 'secondary'}>
                    {diploma.active ? t('Active') : t('Inactive')}
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
                  value={diploma.studentName}
                />
                <div>
                  <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    {t('University name')}
                  </label>
                  <p className="text-base font-medium">{diploma.universityName ?? '-'}</p>
                  <p className="text-muted-foreground text-sm">
                    {t('University code')}: {diploma.universityCode ?? '-'}
                  </p>
                </div>
                <Field
                  icon={<Hash className="h-4 w-4" />}
                  label={t('Diploma number')}
                  value={diploma.diplomaNumber}
                />
                <Field
                  icon={<Hash className="h-4 w-4" />}
                  label={t('Register number')}
                  value={diploma.registerNumber}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Register date')}
                  value={diploma.registerDate}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Graduation date')}
                  value={diploma.graduationDate}
                />
                <Field
                  icon={<Info className="h-4 w-4" />}
                  label={t('Verified')}
                  value={diploma.verify ? t('Verified') : t('Inactive')}
                />
              </Card>

              <Card className="space-y-4 p-4">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  {t('Speciality')}
                </h3>
                <Field
                  icon={<BookOpen className="h-4 w-4" />}
                  label={t('Speciality name')}
                  value={diploma.specialityName}
                />
                <Field
                  icon={<Hash className="h-4 w-4" />}
                  label={t('Speciality code')}
                  value={diploma.specialityCode}
                />
                <Field
                  icon={<GraduationCap className="h-4 w-4" />}
                  label={t('Education type')}
                  value={diploma.educationType}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Education year')}
                  value={diploma.educationYear}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Admission year')}
                  value={diploma.admissionYear}
                />
                <Field
                  icon={<Award className="h-4 w-4" />}
                  label={t('Average grade')}
                  value={diploma.avgGrade}
                />
                <Field
                  icon={<Award className="h-4 w-4" />}
                  label={t('Total credit')}
                  value={diploma.totalCredit}
                />
              </Card>
            </>
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
