import { useTranslation } from 'react-i18next'
import SingleClassifierPage from '@/pages/classifiers/SingleClassifierPage'

/**
 * "Lavozimlar" (Positions) menu card — full list/search/create/edit/delete for
 * the `position` classifier (h_position), reusing the generic classifier CRUD.
 * Editable writes fan out to 224 OTMs (outbox -> Kafka -> webhook).
 */
export default function PositionsPage() {
  const { t } = useTranslation()
  return <SingleClassifierPage apiKey="position" category="employee" title={t('Positions')} />
}
