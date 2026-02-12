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
        <label
          className="mb-1.5 block text-xs font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Filter className="mr-1 inline-block h-3 w-3" />
          {t('Category')}
        </label>
        <input
          type="text"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder={t('menu, button...')}
          className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
          style={{
            borderColor: 'var(--border-color-pro)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Search Filter */}
      <div>
        <label
          className="mb-1.5 block text-xs font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Search className="mr-1 inline-block h-3 w-3" />
          {t('Search')}
        </label>
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('Key or text...')}
          className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
          style={{
            borderColor: 'var(--border-color-pro)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Status Filter */}
      <div>
        <label
          className="mb-1.5 block text-xs font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('Status')}
        </label>
        <select
          value={activeFilter === undefined ? '' : activeFilter ? 'true' : 'false'}
          onChange={(e) =>
            onActiveChange(e.target.value === '' ? undefined : e.target.value === 'true')
          }
          className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
          style={{
            borderColor: 'var(--border-color-pro)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">{t('All')}</option>
          <option value="true">{t('Active')}</option>
          <option value="false">{t('Inactive')}</option>
        </select>
      </div>

      {/* Page Size */}
      <div>
        <label
          className="mb-1.5 block text-xs font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('Show')}
        </label>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
          style={{
            borderColor: 'var(--border-color-pro)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
          }}
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
