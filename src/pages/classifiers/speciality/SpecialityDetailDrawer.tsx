import { useTranslation } from 'react-i18next'
import { GraduationCap } from 'lucide-react'
import { DetailDrawer } from '@/components/DetailDrawer'
import { useSpecialityDetail } from '@/hooks/useSpeciality'
import { SpecialityDetailContent } from './SpecialityDetailContent'

interface SpecialityDetailDrawerProps {
  specialityId: string
  canEdit: boolean
  onClose: () => void
}

/** Slide-over wrapper around {@link SpecialityDetailContent} — used on the list
 *  view and on narrow screens. Desktop tree view docks the content instead. */
export default function SpecialityDetailDrawer({
  specialityId,
  canEdit,
  onClose,
}: SpecialityDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: node, isLoading } = useSpecialityDetail(specialityId)

  return (
    <DetailDrawer
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      icon={<GraduationCap className="text-primary h-6 w-6 shrink-0" aria-hidden="true" />}
      title={isLoading ? t('Loading...') : (node?.nameUz ?? t('Speciality'))}
      description={isLoading ? undefined : `${t('Code')}: ${node?.code ?? '-'}`}
    >
      <SpecialityDetailContent specialityId={specialityId} canEdit={canEdit} />
    </DetailDrawer>
  )
}
