import { useTranslation } from 'react-i18next'
import {
  X,
  Briefcase,
  Building2,
  Users,
  Calendar,
  Info,
  FileText,
  Hash,
  Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useEmployeeJobDetail } from '@/hooks/useEmployeeJobs'

interface EmployeeJobDetailDrawerProps {
  employeeJobId: string
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

export default function EmployeeJobDetailDrawer({
  employeeJobId,
  onClose,
}: EmployeeJobDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: job, isLoading, error } = useEmployeeJobDetail(employeeJobId)

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
            <Briefcase className="text-primary h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? <Skeleton className="h-6 w-48" /> : job?.employeeName}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLoading ? (
                  <Skeleton className="mt-1 h-4 w-32" />
                ) : (
                  `${t('Position')}: ${job?.positionName ?? '-'}`
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
          ) : job ? (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
                  </div>
                  <Badge variant={job.active ? 'default' : 'secondary'}>
                    {job.active ? t('Active') : t('Inactive')}
                  </Badge>
                </div>
              </Card>

              <Card className="space-y-4 p-4">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  {t('Basic information')}
                </h3>

                <Field
                  icon={<Users className="h-4 w-4" />}
                  label={t('Employee')}
                  value={job.employeeName}
                />
                <div>
                  <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    {t('University name')}
                  </label>
                  <p className="text-base font-medium">{job.universityName ?? '-'}</p>
                  <p className="text-muted-foreground text-sm">
                    {t('University code')}: {job.universityCode ?? '-'}
                  </p>
                </div>
                <Field
                  icon={<Building2 className="h-4 w-4" />}
                  label={t('Department')}
                  value={job.departmentName}
                />
                <Field
                  icon={<Info className="h-4 w-4" />}
                  label={t('Employee type')}
                  value={job.employeeTypeName}
                />
                <Field
                  icon={<Info className="h-4 w-4" />}
                  label={t('Position')}
                  value={job.positionName}
                />
                <Field
                  icon={<Info className="h-4 w-4" />}
                  label={t('Employee form')}
                  value={job.employeeFormName}
                />
                <Field icon={<Percent className="h-4 w-4" />} label={t('Rate')} value={job.rate} />
              </Card>

              <Card className="space-y-4 p-4">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  {t('Employee jobs')}
                </h3>
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Job start date')}
                  value={job.jobStartDate}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Job end date')}
                  value={job.jobEndDate}
                />
                <Field
                  icon={<Hash className="h-4 w-4" />}
                  label={t('Contract number')}
                  value={job.contractNumber}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Contract date')}
                  value={job.contractDate}
                />
                <Field
                  icon={<FileText className="h-4 w-4" />}
                  label={t('Decree number')}
                  value={job.decreeNumber}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Decree date')}
                  value={job.decreeDate}
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
