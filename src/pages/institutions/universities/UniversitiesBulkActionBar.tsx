import { useTranslation } from 'react-i18next'
import { FileSpreadsheet } from 'lucide-react'

interface UniversitiesBulkActionBarProps {
  /** Number of currently checked rows. The bar hides itself when this is 0. */
  selectedCount: number
  onExportSelected: () => void
  onClearSelection: () => void
}

/**
 * Inline bar shown above the table when ≥1 row is selected. Lets the user
 * export the chosen subset (client-side CSV — no `xlsx` dep) or clear
 * the selection. Extracted from UniversitiesPage so the table renders
 * stay readable at glance.
 */
export function UniversitiesBulkActionBar({
  selectedCount,
  onExportSelected,
  onClearSelection,
}: UniversitiesBulkActionBarProps) {
  const { t } = useTranslation()

  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-3 border-b border-[var(--primary)]/10 bg-[var(--active-bg)] px-4 py-2">
      <span className="text-sm font-medium text-[var(--primary)]">
        {selectedCount} {t('selected')}
      </span>
      <div className="h-4 w-px bg-[var(--primary)]/20" />
      <button
        onClick={onExportSelected}
        className="inline-flex items-center gap-1 rounded-md bg-[var(--emerald-bg)] px-2 py-0.5 text-xs font-medium text-[var(--emerald-text)] transition-colors hover:opacity-80"
      >
        <FileSpreadsheet className="h-3 w-3" />
        {t('Export selected')}
      </button>
      <button
        onClick={onClearSelection}
        className="ml-auto text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        {t('Clear')}
      </button>
    </div>
  )
}
