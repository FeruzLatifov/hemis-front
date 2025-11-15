import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X, Building2, Code, Calendar, User, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { facultiesApi } from '@/api/faculties.api';

interface FacultyDetailDrawerProps {
  facultyCode: string;
  onClose: () => void;
}

export default function FacultyDetailDrawer({ facultyCode, onClose }: FacultyDetailDrawerProps) {
  const { t, i18n } = useTranslation();

  const { data: faculty, isLoading, error } = useQuery({
    queryKey: ['faculty-detail', facultyCode],
    queryFn: () => facultiesApi.getFacultyDetail(facultyCode),
    enabled: !!facultyCode,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end animate-in fade-in duration-200">
      <div className="bg-background h-full w-full max-w-2xl shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? <Skeleton className="h-6 w-48" /> : faculty?.nameUz}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? <Skeleton className="h-4 w-32 mt-1" /> : `${t('table.faculty.code')}: ${faculty?.code}`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-6 w-full" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-6 border-red-200 bg-red-50">
              <p className="text-red-600">
                {t('errors.loadFailed')}: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </Card>
          ) : faculty ? (
            <>
              {/* Status */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {t('table.faculty.status')}
                    </span>
                  </div>
                  <Badge variant={faculty.status ? 'default' : 'secondary'}>
                    {faculty.status ? t('filters.statusActive') : t('filters.statusInactive')}
                  </Badge>
                </div>
              </Card>

              {/* Basic Information */}
              <Card className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('details.basicInfo')}
                </h3>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Code className="h-4 w-4" />
                    {t('table.faculty.code')}
                  </label>
                  <p className="text-base font-medium">{faculty.code}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4" />
                    {t('table.faculty.universityName')}
                  </label>
                  <p className="text-base font-medium">{faculty.universityName}</p>
                  <p className="text-sm text-muted-foreground">{t('table.faculty.universityCode')}: {faculty.universityCode}</p>
                </div>

                {faculty.shortName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1">
                      {t('details.shortName')}
                    </label>
                    <p className="text-base">{faculty.shortName}</p>
                  </div>
                )}

                {faculty.departmentType && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1">
                      {t('details.facultyType')}
                    </label>
                    <p className="text-base">{faculty.departmentTypeName || faculty.departmentType}</p>
                  </div>
                )}
              </Card>

              {/* Audit Information */}
              <Card className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('details.auditInfo')}
                </h3>

                {faculty.createdAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4" />
                      {t('details.createdAt')}
                    </label>
                    <p className="text-base">{formatDate(faculty.createdAt)}</p>
                    {faculty.createdBy && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {faculty.createdBy}
                      </p>
                    )}
                  </div>
                )}

                {faculty.updatedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4" />
                      {t('details.updatedAt')}
                    </label>
                    <p className="text-base">{formatDate(faculty.updatedAt)}</p>
                    {faculty.updatedBy && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
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
        <div className="sticky bottom-0 bg-background border-t px-6 py-4">
          <Button onClick={onClose} className="w-full">
            {t('actions.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}

