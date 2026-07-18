import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DetailDrawer } from '@/components/DetailDrawer'
import type { StudentRow } from '@/api/students.api'

type DictKey =
  | 'courses'
  | 'studentStatuses'
  | 'paymentForms'
  | 'educationTypes'
  | 'educationForms'
  | 'genders'

interface StudentDetailDrawerProps {
  student: StudentRow
  onClose: () => void
  /** Resolves a dictionary code to its localized name (shared with the list). */
  resolveName: (dictKey: DictKey, code: string) => string
}

function Field({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground mb-0.5 text-sm font-medium">{label}</p>
      <p className="text-base break-words">{value || '—'}</p>
    </div>
  )
}

export default function StudentDetailDrawer({
  student,
  onClose,
  resolveName,
}: StudentDetailDrawerProps) {
  const { t } = useTranslation()

  return (
    <DetailDrawer
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      icon={<GraduationCap className="text-primary h-6 w-6" aria-hidden="true" />}
      title={student.fullName}
      description={`${t('Code')}: ${student.code}`}
      footer={
        <Button onClick={onClose} className="w-full">
          {t('Close')}
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('PINFL')} value={student.pinfl} />
        <Field label={t('Group name')} value={student.groupName} />
        <Field label={t('University name')} value={student.university} />
        <Field label={t('Faculty')} value={student.faculty} />
        <Field label={t('Speciality')} value={student.speciality} />
        <Field label={t('Course')} value={resolveName('courses', student.course)} />
        <Field
          label={t('Education type')}
          value={resolveName('educationTypes', student.educationType)}
        />
        <Field
          label={t('Education form')}
          value={resolveName('educationForms', student.educationForm)}
        />
        <Field label={t('Payment form')} value={resolveName('paymentForms', student.paymentForm)} />
        <Field label={t('Status')} value={resolveName('studentStatuses', student.studentStatus)} />
        <Field label={t('Gender')} value={resolveName('genders', student.gender)} />
        <Field label={t('Education year')} value={student.educationYear} />
      </div>
    </DetailDrawer>
  )
}
