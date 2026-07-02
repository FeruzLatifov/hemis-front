import { useTranslation } from 'react-i18next'
import { X, GraduationCap, Building2, Calendar, Info, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useAttachedSpeciality } from '@/hooks/useAttachedSpecialities'
import type { SpecialityLevel } from '@/api/attachedSpecialities.api'

const LEVEL_LABELS: Record<SpecialityLevel, string> = {
  BACHELOR: 'Bachelor',
  MASTER: 'Master',
  ORDINATURA: 'Ordinatura',
  DOCTORAL: 'Doctoral',
}

interface AttachedSpecialityDetailDrawerProps {
  attachedSpecialityId: string
  onClose: () => void
}

export default function AttachedSpecialityDetailDrawer({
  attachedSpecialityId,
  onClose,
}: AttachedSpecialityDetailDrawerProps) {
  const { t, i18n } = useTranslation()

  const { data: item, isLoading, error } = useAttachedSpeciality(attachedSpecialityId)

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
        {/* Header */}
        <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-primary h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? <Skeleton className="h-6 w-48" /> : item?.specialityName}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLoading ? <Skeleton className="mt-1 h-4 w-32" /> : item?.universityName}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
            {t('Close')}
          </Button>
        </div>

        {/* Content */}
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
          ) : item ? (
            <>
              {/* Status */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
                  </div>
                  <Badge variant={item.active ? 'default' : 'secondary'}>
                    {item.active ? t('Active') : t('Inactive')}
                  </Badge>
                </div>
              </Card>

              {/* Basic information */}
              <Card className="space-y-4 p-4">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  {t('Basic information')}
                </h3>

                <div>
                  <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    {t('University')}
                  </label>
                  <p className="text-base font-medium">{item.universityName}</p>
                  <p className="text-muted-foreground text-sm">{item.universityCode}</p>
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="h-4 w-4" />
                    {t('Speciality')}
                  </label>
                  <p className="text-base font-medium">{item.specialityName}</p>
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 text-sm font-medium">
                    {t('Speciality level')}
                  </label>
                  <p className="text-base">{t(LEVEL_LABELS[item.specialityLevel])}</p>
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 text-sm font-medium">
                    {t('Education type')}
                  </label>
                  <p className="text-base">{item.educationTypeName || item.educationType}</p>
                </div>

                {item.educationForm && (
                  <div>
                    <label className="text-muted-foreground mb-1 text-sm font-medium">
                      {t('Education form')}
                    </label>
                    <p className="text-base">{item.educationFormName || item.educationForm}</p>
                  </div>
                )}
              </Card>

              {/* Audit information */}
              {(item.createdAt || item.updatedAt) && (
                <Card className="space-y-4 p-4">
                  <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                    {t('Audit information')}
                  </h3>

                  {item.createdAt && (
                    <div>
                      <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4" />
                        {t('Created at')}
                      </label>
                      <p className="text-base">{formatDate(item.createdAt)}</p>
                    </div>
                  )}

                  {item.updatedAt && (
                    <div>
                      <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4" />
                        {t('Updated at')}
                      </label>
                      <p className="text-base">{formatDate(item.updatedAt)}</p>
                    </div>
                  )}
                </Card>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-background sticky bottom-0 border-t px-6 py-4">
          <Button onClick={onClose} className="w-full">
            {t('Close')}
          </Button>
        </div>
      </div>
    </div>
  )
}
