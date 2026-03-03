import {
  X,
  AlertTriangle,
  Building2,
  CheckCircle,
  Layers,
  GraduationCap,
  ArrowRightLeft,
  ArrowLeftRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from 'react-i18next'
import { useDuplicateGroupDetail } from '@/hooks/useStudents'
import type { DuplicateStudentCard, DuplicateReason } from '@/api/students.api'

interface DuplicateDetailDrawerProps {
  pinfl: string | null
  onClose: () => void
}

const REASON_COLORS: Record<
  DuplicateReason,
  { bg: string; text: string; icon: typeof AlertTriangle }
> = {
  CROSS_UNIVERSITY: {
    bg: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    icon: Building2,
  },
  SAME_UNIVERSITY: {
    bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    icon: AlertTriangle,
  },
  MULTI_LEVEL: {
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: Layers,
  },
  INTERNAL_TRANSFER: {
    bg: 'bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-900/30',
    text: 'text-teal-700 dark:text-teal-400',
    icon: ArrowRightLeft,
  },
  EXTERNAL_TRANSFER: {
    bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: ArrowLeftRight,
  },
  NORMAL: {
    bg: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    icon: CheckCircle,
  },
}

export default function DuplicateDetailDrawer({ pinfl, onClose }: DuplicateDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: detail, isLoading } = useDuplicateGroupDetail(pinfl)

  if (!pinfl) return null

  const reasonStyle = detail ? REASON_COLORS[detail.reason] : null
  const ReasonIcon = reasonStyle?.icon || AlertTriangle

  return (
    <div
      role="button"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col border-l border-[var(--border-color-pro)] bg-[var(--card-bg)]"
        style={{ boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color-pro)] px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              {t('Duplicate analysis')}
            </h2>
            <p className="font-mono text-sm text-[var(--text-secondary)]">PINFL: {pinfl}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-5">
              {/* Student name */}
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  {detail.fullName}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {detail.count} {t('records')}, {detail.universityCount} {t('universities')},{' '}
                  {detail.activeCount} {t('active')}
                </p>
              </div>

              {/* Analysis banner */}
              {reasonStyle && (
                <div className={`rounded-lg border p-4 ${reasonStyle.bg}`}>
                  <div className="flex items-start gap-3">
                    <ReasonIcon className={`mt-0.5 h-5 w-5 shrink-0 ${reasonStyle.text}`} />
                    <div>
                      <p className={`font-medium ${reasonStyle.text}`}>
                        {detail.reasonDescription}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {detail.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Student cards */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[var(--text-secondary)] uppercase">
                  {t('Enrollment records')}
                </h4>
                {detail.students.map((student) => (
                  <StudentCard key={student.id} student={student} t={t} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-16">
              <AlertTriangle className="h-12 w-12 text-[var(--border-color-pro)]" />
              <p className="text-sm text-[var(--text-secondary)]">{t('No data found')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-color-pro)] px-6 py-3">
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('Close')}
          </Button>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// StudentCard — one enrollment record
// =====================================================

function StudentCard({
  student,
  t,
}: {
  student: DuplicateStudentCard
  t: (key: string) => string
}) {
  const isActive = student.active

  return (
    <Card
      className={`border ${isActive ? 'border-green-200 dark:border-green-900/30' : 'border-[var(--border-color-pro)]'}`}
    >
      <CardContent className="p-4">
        {/* University + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--text-primary)]">{student.universityName}</p>
            <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">{student.code}</p>
          </div>
          <Badge
            className={
              isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                : 'bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)]'
            }
          >
            {isActive ? (
              <CheckCircle className="mr-1 h-3 w-3" />
            ) : (
              <GraduationCap className="mr-1 h-3 w-3" />
            )}
            {student.studentStatusName}
          </Badge>
        </div>

        {/* Details grid */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {student.specialityName && (
            <DetailItem label={t('Speciality')} value={student.specialityName} />
          )}
          <DetailItem label={t('Education type')} value={student.educationTypeName} />
          <DetailItem label={t('Education form')} value={student.educationFormName} />
          <DetailItem label={t('Payment form')} value={student.paymentFormName} />
          <DetailItem label={t('Course')} value={student.courseName} />
          {student.groupName && <DetailItem label={t('Group')} value={student.groupName} />}
          {student.educationYear && (
            <DetailItem label={t('Education year')} value={student.educationYear} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
