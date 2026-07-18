import { useTranslation } from 'react-i18next'
import { Building2, Code, Calendar, User, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DetailDrawer } from '@/components/DetailDrawer'
import { useDepartmentDetail } from '@/hooks/useDepartments'

interface DepartmentDetailDrawerProps {
  departmentCode: string
  onClose: () => void
}

export default function DepartmentDetailDrawer({
  departmentCode,
  onClose,
}: DepartmentDetailDrawerProps) {
  const { t, i18n } = useTranslation()

  const { data: department, isLoading, error } = useDepartmentDetail(departmentCode)

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <DetailDrawer
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      icon={<Building2 className="text-primary h-6 w-6" aria-hidden="true" />}
      title={isLoading ? t('Loading...') : (department?.nameUz ?? t('Department'))}
      description={department ? `${t('Code')}: ${department.code}` : undefined}
      footer={
        <Button onClick={onClose} className="w-full">
          {t('Close')}
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
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
      ) : department ? (
        <div className="space-y-6">
          {/* Status */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
              </div>
              <Badge variant={department.status ? 'default' : 'secondary'}>
                {department.status ? t('Active') : t('Inactive')}
              </Badge>
            </div>
          </Card>

          {/* Basic Information */}
          <Card className="space-y-4 p-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {t('Basic information')}
            </h3>

            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <Code className="h-4 w-4" />
                {t('Code')}
              </label>
              <p className="text-base font-medium">{department.code}</p>
            </div>

            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                {t('University name')}
              </label>
              <p className="text-base font-medium">{department.universityName}</p>
              <p className="text-muted-foreground text-sm">
                {t('University code')}: {department.universityCode}
              </p>
            </div>

            {department.shortName && (
              <div>
                <label className="text-muted-foreground mb-1 text-sm font-medium">
                  {t('Short name')}
                </label>
                <p className="text-base">{department.shortName}</p>
              </div>
            )}

            {department.departmentType && (
              <div>
                <label className="text-muted-foreground mb-1 text-sm font-medium">
                  {t('Department type')}
                </label>
                <p className="text-base">
                  {department.departmentTypeName || department.departmentType}
                </p>
              </div>
            )}
          </Card>

          {/* Audit Information */}
          <Card className="space-y-4 p-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              {t('Audit information')}
            </h3>

            {department.createdAt && (
              <div>
                <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  {t('Created at')}
                </label>
                <p className="text-base">{formatDate(department.createdAt)}</p>
                {department.createdBy && (
                  <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                    <User className="h-3 w-3" />
                    {department.createdBy}
                  </p>
                )}
              </div>
            )}

            {department.updatedAt && (
              <div>
                <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  {t('Updated at')}
                </label>
                <p className="text-base">{formatDate(department.updatedAt)}</p>
                {department.updatedBy && (
                  <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                    <User className="h-3 w-3" />
                    {department.updatedBy}
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </DetailDrawer>
  )
}
