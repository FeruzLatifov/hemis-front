import { useTranslation } from 'react-i18next'
import {
  X,
  FileText,
  Hash,
  Building2,
  Calendar,
  Info,
  Tag,
  GraduationCap,
  StickyNote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDiplomaBlankDistribution } from '@/hooks/useDiplomaBlankDistribution'

interface DistributionDetailDrawerProps {
  distributionId: string
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

export default function DistributionDetailDrawer({
  distributionId,
  onClose,
}: DistributionDetailDrawerProps) {
  const { t, i18n } = useTranslation()
  const { data: item, isLoading, error } = useDiplomaBlankDistribution(distributionId)

  const formatDate = (dateString?: string | null) => {
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
        <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <FileText className="text-primary h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? <Skeleton className="h-6 w-48" /> : (item?.universityName ?? '-')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLoading ? (
                  <Skeleton className="mt-1 h-4 w-32" />
                ) : (
                  `${t('Series')}: ${item?.blankSeria ?? '-'} · ${t('Quantity')}: ${item?.quantity ?? '-'}`
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
          ) : item ? (
            <>
              <Card className="space-y-4 p-4">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  {t('Basic information')}
                </h3>

                <div>
                  <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    {t('University name')}
                  </label>
                  <p className="text-base font-medium">{item.universityName ?? '-'}</p>
                  <p className="text-muted-foreground text-sm">
                    {t('University code')}: {item.universityCode}
                  </p>
                </div>

                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Education year')}
                  value={item.educationYearName || item.educationYear}
                />
                <Field
                  icon={<GraduationCap className="h-4 w-4" />}
                  label={t('Education type')}
                  value={item.educationTypeName || item.educationType}
                />
                <Field
                  icon={<Tag className="h-4 w-4" />}
                  label={t('Blank category')}
                  value={item.blankCategoryName || item.blankCategory}
                />
              </Card>

              <Card className="space-y-4 p-4">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  {t('Blank distribution')}
                </h3>
                <Field
                  icon={<Hash className="h-4 w-4" />}
                  label={t('Series')}
                  value={item.blankSeria}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    icon={<Hash className="h-4 w-4" />}
                    label={t('Start number')}
                    value={item.blankStartNumber}
                  />
                  <Field
                    icon={<Hash className="h-4 w-4" />}
                    label={t('End number')}
                    value={item.blankEndNumber}
                  />
                </div>
                <Field
                  icon={<Hash className="h-4 w-4" />}
                  label={t('Quantity')}
                  value={item.quantity}
                />
                <Field
                  icon={<Info className="h-4 w-4" />}
                  label={t('Status')}
                  value={item.generateStatusName || item.generateStatusCode}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('Distribution date')}
                  value={item.distributionDate}
                />
                {item.note && (
                  <Field
                    icon={<StickyNote className="h-4 w-4" />}
                    label={t('Note')}
                    value={item.note}
                  />
                )}
              </Card>

              {(item.createdAt || item.updatedAt) && (
                <Card className="space-y-4 p-4">
                  <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                    {t('Audit information')}
                  </h3>
                  {item.createdAt && (
                    <Field
                      icon={<Calendar className="h-4 w-4" />}
                      label={t('Created at')}
                      value={formatDate(item.createdAt)}
                    />
                  )}
                  {item.updatedAt && (
                    <Field
                      icon={<Calendar className="h-4 w-4" />}
                      label={t('Updated at')}
                      value={formatDate(item.updatedAt)}
                    />
                  )}
                </Card>
              )}
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
