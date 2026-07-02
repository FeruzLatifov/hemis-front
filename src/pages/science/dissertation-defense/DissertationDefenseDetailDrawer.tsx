import { useTranslation } from 'react-i18next'
import { X, Award, Building2, Users, Calendar, Info, Hash, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useDissertationDefenseDetail } from '@/hooks/useDissertationDefense'

interface DissertationDefenseDetailDrawerProps {
  defenseId: string
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

export default function DissertationDefenseDetailDrawer({
  defenseId,
  onClose,
}: DissertationDefenseDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: defense, isLoading, error } = useDissertationDefenseDetail(defenseId)

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
            <Award className="text-primary h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? <Skeleton className="h-6 w-48" /> : defense?.studentName}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLoading ? (
                  <Skeleton className="mt-1 h-4 w-32" />
                ) : (
                  `${t('Diploma number')}: ${defense?.diplomaNumber ?? '-'}`
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
          ) : defense ? (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
                  </div>
                  <Badge variant={defense.active ? 'default' : 'secondary'}>
                    {defense.active ? t('Active') : t('Inactive')}
                  </Badge>
                </div>
              </Card>

              <Card className="space-y-4 p-4">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  {t('Basic information')}
                </h3>

                <Field
                  icon={<Users className="h-4 w-4" />}
                  label={t('Student name')}
                  value={defense.studentName}
                />
                <div>
                  <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    {t('University name')}
                  </label>
                  <p className="text-base font-medium">{defense.universityName ?? '-'}</p>
                  <p className="text-muted-foreground text-sm">
                    {t('University code')}: {defense.universityCode ?? '-'}
                  </p>
                </div>
                <Field
                  icon={<Hash className="h-4 w-4" />}
                  label={t('Speciality code')}
                  value={defense.specialityCode}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Defense date')}
                  value={defense.defenseDate}
                />
                <Field
                  icon={<MapPin className="h-4 w-4" />}
                  label={t('Defense place')}
                  value={defense.defensePlace}
                />
              </Card>

              <Card className="space-y-4 p-4">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  {t('Diploma number')}
                </h3>
                <Field
                  icon={<Hash className="h-4 w-4" />}
                  label={t('Diploma number')}
                  value={defense.diplomaNumber}
                />
                <Field
                  icon={<Hash className="h-4 w-4" />}
                  label={t('Register number')}
                  value={defense.registerNumber}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Approved date')}
                  value={defense.approvedDate}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Diploma given date')}
                  value={defense.diplomaGivenDate}
                />
                <Field
                  icon={<FileText className="h-4 w-4" />}
                  label={t('Diploma given by whom')}
                  value={defense.diplomaGivenByWhom}
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
