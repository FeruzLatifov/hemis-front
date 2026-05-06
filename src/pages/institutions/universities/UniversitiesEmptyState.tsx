import { useTranslation } from 'react-i18next'
import { Search, Plus } from 'lucide-react'

interface UniversitiesEmptyStateProps {
  /** True when the user is filtering or searching — message changes accordingly. */
  isFiltered: boolean
  onCreate: () => void
  onClearFilters: () => void
}

/**
 * The "no rows" cell of the universities table. Two flavours:
 *   - first-time empty (no filter applied)  → primary CTA: Add
 *   - filter-empty (search returned 0 hits) → secondary: clear filters
 *
 * Pulled out so the page-level table render stays focused on iteration.
 */
export function UniversitiesEmptyState({
  isFiltered,
  onCreate,
  onClearFilters,
}: UniversitiesEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-3">
      <Search className="h-8 w-8 text-[var(--text-secondary)]" />
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{t('No data found')}</p>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
          {isFiltered
            ? t('Try changing your search or filters')
            : t('No universities have been added yet')}
        </p>
      </div>
      {!isFiltered && (
        <button
          onClick={onCreate}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('Add')}
        </button>
      )}
      {isFiltered && (
        <button
          onClick={onClearFilters}
          className="mt-1 text-xs text-[var(--primary)] transition-colors hover:underline"
        >
          {t('Clear')} {t('Filters').toLowerCase()}
        </button>
      )}
    </div>
  )
}
