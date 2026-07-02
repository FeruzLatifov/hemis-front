import { useTranslation } from 'react-i18next'
import { useClassifiersByCategory } from '@/hooks/useClassifiers'
import ClassifierTablePanel from './ClassifierTablePanel'
import type { ClassifierMetadata } from '@/api/classifiers.api'

interface SingleClassifierPageProps {
  /** Backend classifier apiKey (e.g. "position", "qualification"). */
  apiKey: string
  /**
   * Category key the classifier is registered under (backend
   * `Category.name().toLowerCase()`, e.g. "employee"). Used to resolve the
   * classifier metadata (editable/hierarchical/...) via the generic API.
   */
  category: string
  /** Page header, already translated. */
  title: string
}

/**
 * Deep-link page that renders the generic classifier CRUD panel scoped to a
 * SINGLE classifier by apiKey. Reuses the generic classifier API/hooks — no
 * bespoke controllers. Editable affordances come from backend metadata.
 */
export default function SingleClassifierPage({
  apiKey,
  category,
  title,
}: SingleClassifierPageProps) {
  const { t } = useTranslation()
  const { data: classifiers, isLoading } = useClassifiersByCategory(category)

  const classifier = classifiers?.find((c: ClassifierMetadata) => c.apiKey === apiKey)

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
      </div>

      {classifier ? (
        <ClassifierTablePanel key={classifier.apiKey} classifier={classifier} showHeader={false} />
      ) : (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-[var(--text-secondary)]">
            {isLoading ? t('Loading...') : t('No data found')}
          </p>
        </div>
      )}
    </div>
  )
}
