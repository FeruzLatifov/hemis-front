import { useTranslation } from 'react-i18next'
import SingleClassifierPage from '@/pages/classifiers/SingleClassifierPage'

/**
 * "Malakalar" (Qualifications) menu card — full list/search/create/edit/delete
 * for the `qualification` classifier (hemishe_h_qualification), reusing the
 * generic classifier CRUD. Editable writes fan out to 224 OTMs.
 */
export default function QualificationsPage() {
  const { t } = useTranslation()
  return (
    <SingleClassifierPage apiKey="qualification" category="employee" title={t('Qualifications')} />
  )
}
