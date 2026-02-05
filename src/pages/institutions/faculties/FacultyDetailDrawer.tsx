import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { X, Building2, Code, Calendar, User, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { facultiesApi } from '@/api/faculties.api'

interface FacultyDetailDrawerProps {
  facultyCode: string
  onClose: () => void
}

export default function FacultyDetailDrawer({ facultyCode, onClose }: FacultyDetailDrawerProps) {
  const { t, i18n } = useTranslation()

  const {
    data: faculty,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['faculty-detail', facultyCode],
    queryFn: () => facultiesApi.getFacultyDetail(facultyCode),
    enabled: !!facultyCode,
  })

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
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-end bg-black/50 duration-200">
      <div className="bg-background animate-in slide-in-from-right h-full w-full max-w-2xl overflow-y-auto shadow-2xl duration-300">
        {/* Header */}
        <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="text-primary h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? <Skeleton className="h-6 w-48" /> : faculty?.nameUz}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLoading ? (
                  <Skeleton className="mt-1 h-4 w-32" />
                ) : (
                  `${t('Code')}: ${faculty?.code}`
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
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
            <Card className="border-red-200 bg-red-50 p-6">
              <p className="text-red-600">
                {t('Failed to load data')}:{' '}
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </Card>
          ) : faculty ? (
            <>
              {/* Status */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm font-medium">{t('Status')}</span>
                  </div>
                  <Badge variant={faculty.status ? 'default' : 'secondary'}>
                    {faculty.status ? t('Active') : t('Inactive')}
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
                  <p className="text-base font-medium">{faculty.code}</p>
                </div>

                <div>
                  <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    {t('University name')}
                  </label>
                  <p className="text-base font-medium">{faculty.universityName}</p>
                  <p className="text-muted-foreground text-sm">
                    {t('University code')}: {faculty.universityCode}
                  </p>
                </div>

                {faculty.shortName && (
                  <div>
                    <label className="text-muted-foreground mb-1 text-sm font-medium">
                      {t('Short name')}
                    </label>
                    <p className="text-base">{faculty.shortName}</p>
                  </div>
                )}

                {faculty.departmentType && (
                  <div>
                    <label className="text-muted-foreground mb-1 text-sm font-medium">
                      {t('Faculty type')}
                    </label>
                    <p className="text-base">
                      {faculty.departmentTypeName || faculty.departmentType}
                    </p>
                  </div>
                )}
              </Card>

              {/* Audit Information */}
              <Card className="space-y-4 p-4">
                <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  {t('Audit information')}
                </h3>

                {faculty.createdAt && (
                  <div>
                    <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      {t('Created at')}
                    </label>
                    <p className="text-base">{formatDate(faculty.createdAt)}</p>
                    {faculty.createdBy && (
                      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                        <User className="h-3 w-3" />
                        {faculty.createdBy}
                      </p>
                    )}
                  </div>
                )}

                {faculty.updatedAt && (
                  <div>
                    <label className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      {t('Updated at')}
                    </label>
                    <p className="text-base">{formatDate(faculty.updatedAt)}</p>
                    {faculty.updatedBy && (
                      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                        <User className="h-3 w-3" />
                        {faculty.updatedBy}
                      </p>
                    )}
                  </div>
                )}
              </Card>
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
