import { useCallback, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useClassifiersByCategory } from '@/hooks/useClassifiers'
import ClassifierTablePanel from './ClassifierTablePanel'
import type { ClassifierMetadata } from '@/api/classifiers.api'

export default function ClassifierCategoryPage() {
  const { t } = useTranslation()
  const { category } = useParams<{ category: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Selected classifier from the category list
  const selectedApiKey = searchParams.get('cls') || ''

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            next.set(key, value)
          } else {
            next.delete(key)
          }
        })
        return next
      })
    },
    [setSearchParams],
  )

  // Queries
  const { data: classifiers, isLoading: isLoadingClassifiers } = useClassifiersByCategory(
    category || '',
  )

  // Selected classifier metadata
  const selectedClassifier = classifiers?.find(
    (c: ClassifierMetadata) => c.apiKey === selectedApiKey,
  )

  // Auto-select first classifier
  useEffect(() => {
    if (classifiers && classifiers.length > 0 && !selectedApiKey) {
      updateSearchParams({ cls: classifiers[0].apiKey })
    }
  }, [classifiers, selectedApiKey, updateSearchParams])

  const handleSelectClassifier = useCallback(
    (apiKey: string) => {
      // Switching tab clears per-classifier URL state; remount (via key) resets
      // the panel's internal search/create/edit/delete state cleanly.
      updateSearchParams({ cls: apiKey, page: undefined, q: undefined, size: undefined })
    },
    [updateSearchParams],
  )

  return (
    <div className="flex h-full flex-col p-4">
      {/* Top — classifier tabs (horizontal scrollable) */}
      <div className="mb-4 rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)]">
        <div className="flex flex-wrap gap-1 p-1.5">
          {isLoadingClassifiers ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-32 animate-pulse rounded-md bg-[var(--hover-bg)]" />
            ))
          ) : classifiers && classifiers.length > 0 ? (
            classifiers.map((cls: ClassifierMetadata) => (
              <button
                key={cls.apiKey}
                onClick={() => handleSelectClassifier(cls.apiKey)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  selectedApiKey === cls.apiKey
                    ? 'bg-blue-600 font-medium text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <span className="whitespace-nowrap">{cls.titleUz}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    selectedApiKey === cls.apiKey
                      ? 'bg-blue-500 text-blue-100'
                      : 'bg-[var(--hover-bg)] text-[var(--text-secondary)]'
                  }`}
                >
                  {cls.itemCount}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-[var(--text-secondary)]">{t('No data found')}</p>
          )}
        </div>
      </div>

      {/* Content — table area (single-classifier CRUD panel) */}
      {selectedClassifier ? (
        <ClassifierTablePanel key={selectedClassifier.apiKey} classifier={selectedClassifier} />
      ) : (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-[var(--text-secondary)]">
            {isLoadingClassifiers ? t('Loading...') : t('No data found')}
          </p>
        </div>
      )}
    </div>
  )
}
