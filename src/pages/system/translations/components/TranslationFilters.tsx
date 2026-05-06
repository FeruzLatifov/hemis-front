/**
 * Translation Filters Component
 *
 * Filter controls for translations list (category, search, status, page size)
 */

import { useTranslation } from 'react-i18next'
import { Search, Filter } from 'lucide-react'

interface TranslationFiltersProps {
  categoryFilter: string
  searchFilter: string
  activeFilter: boolean | undefined
  pageSize: number
  onCategoryChange: (value: string) => void
  onSearchChange: (value: string) => void
  onActiveChange: (value: boolean | undefined) => void
  onPageSizeChange: (value: number) => void
}

const FIELD_LABEL = 'mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]'
const FIELD_INPUT =
  'w-full rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none'

export function TranslationFilters({
  categoryFilter,
  searchFilter,
  activeFilter,
  pageSize,
  onCategoryChange,
  onSearchChange,
  onActiveChange,
  onPageSizeChange,
}: TranslationFiltersProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-4 gap-3">
      {/* Category Filter */}
      <div>
        <label className={FIELD_LABEL}>
          <Filter className="mr-1 inline-block h-3 w-3" />
          {t('Category')}
        </label>
        <input
          type="text"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder={t('menu, button...')}
          className={FIELD_INPUT}
        />
      </div>

      {/* Search Filter */}
      <div>
        <label className={FIELD_LABEL}>
          <Search className="mr-1 inline-block h-3 w-3" />
          {t('Search')}
        </label>
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('Key or text...')}
          className={FIELD_INPUT}
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className={FIELD_LABEL}>{t('Status')}</label>
        <select
          value={activeFilter === undefined ? '' : activeFilter ? 'true' : 'false'}
          onChange={(e) =>
            onActiveChange(e.target.value === '' ? undefined : e.target.value === 'true')
          }
          className={FIELD_INPUT}
        >
          <option value="">{t('All')}</option>
          <option value="true">{t('Active')}</option>
          <option value="false">{t('Inactive')}</option>
        </select>
      </div>

      {/* Page Size */}
      <div>
        <label className={FIELD_LABEL}>{t('Show')}</label>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className={`${FIELD_INPUT} font-semibold`}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
  )
}
