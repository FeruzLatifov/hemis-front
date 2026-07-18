import { useTranslation } from 'react-i18next'
import { Users, Hash, Building2, GraduationCap, Calendar, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DetailDrawer } from '@/components/DetailDrawer'
import { useGroupDetail } from '@/hooks/useGroups'

interface GroupDetailDrawerProps {
  groupId: string
  onClose: () => void
}

export default function GroupDetailDrawer({ groupId, onClose }: GroupDetailDrawerProps) {
  const { t } = useTranslation()

  const { data: group, isLoading, error } = useGroupDetail(groupId)

  return (
    <DetailDrawer
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      icon={<Users className="text-primary h-6 w-6" aria-hidden="true" />}
      title={isLoading ? t('Loading...') : (group?.groupName ?? t('Group'))}
      description={group ? `${t('Group ID')}: ${group.groupId}` : undefined}
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
      ) : group ? (
        <div className="space-y-6">
          {/* Status */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
              </div>
              <Badge variant={group.active ? 'default' : 'secondary'}>
                {group.active ? t('Active') : t('Inactive')}
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
                <Users className="h-4 w-4" />
                {t('Group name')}
              </label>
              <p className="text-base font-medium">{group.groupName}</p>
            </div>

            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <Hash className="h-4 w-4" />
                {t('Group ID')}
              </label>
              <p className="text-base font-medium">{group.groupId}</p>
            </div>

            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                {t('University name')}
              </label>
              <p className="text-base font-medium">{group.universityName}</p>
              <p className="text-muted-foreground text-sm">
                {t('University code')}: {group.universityCode}
              </p>
            </div>

            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4" />
                {t('Education type')}
              </label>
              <p className="text-base">
                {group.educationTypeName || group.educationTypeCode || '-'}
              </p>
            </div>

            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                {t('Education year')}
              </label>
              <p className="text-base">
                {group.educationYearName || group.educationYearCode || '-'}
              </p>
            </div>
          </Card>
        </div>
      ) : null}
    </DetailDrawer>
  )
}
