import { useTranslation } from 'react-i18next'
import { Inbox } from 'lucide-react'

/**
 * Shared empty-state for report blocks that have no data for the current
 * filter selection. Kept as its own component so every viz wrapper renders an
 * identical, i18n-safe placeholder.
 */
export function ReportEmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-[var(--text-secondary)]">
      <Inbox className="h-8 w-8" aria-hidden="true" />
      <p className="text-sm">{t('No report data available')}</p>
    </div>
  )
}
