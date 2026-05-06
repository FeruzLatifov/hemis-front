/**
 * Toolbar for the Universities table page.
 *
 * Owns the row of controls above the table: filter toggle, search box,
 * total count, density/refresh/export actions, column visibility popover,
 * and the Create-University primary action. Extracted from
 * UniversitiesPage.tsx to keep the parent under 1k LOC and to give the
 * toolbar a clear, prop-driven contract.
 */

import { type Ref } from 'react'
import { type Table } from '@tanstack/react-table'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, RefreshCw, FileSpreadsheet, SlidersHorizontal, Rows3 } from 'lucide-react'
import { SearchScopeSelector } from '@/components/filters/SearchScopeSelector'
import { ColumnSettingsPopover } from '@/components/filters/ColumnSettingsPopover'
import type { ResolvedRow } from './universities-columns'

type Density = 'compact' | 'comfortable'

interface UniversitiesToolbarProps {
  // Filter state
  showFiltersPanel: boolean
  onToggleFiltersPanel: () => void
  activeFilterCount: number

  // Search
  searchScope: string
  onScopeChange: (value: string) => void
  searchScopes: Array<{ value: string; label: string }>
  searchInput: string
  onSearchInputChange: (value: string) => void
  onSearch: () => void
  onClearSearch: () => void
  searchContainerRef: Ref<HTMLDivElement>

  // Status
  totalElements: number
  isLoading: boolean

  // View controls
  density: Density
  onDensityToggle: () => void

  // Actions
  onRefresh: () => void
  onExportAll: () => void

  // Column visibility (delegated to TanStack Table)
  table: Table<ResolvedRow>
}

export function UniversitiesToolbar({
  showFiltersPanel,
  onToggleFiltersPanel,
  activeFilterCount,
  searchScope,
  onScopeChange,
  searchScopes,
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  searchContainerRef,
  totalElements,
  isLoading,
  density,
  onDensityToggle,
  onRefresh,
  onExportAll,
  table,
}: UniversitiesToolbarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isCompact = density === 'compact'

  return (
    <div className="flex items-center gap-2 border-b border-[var(--border-color-pro)] px-4 py-2.5">
      {/* Filter toggle */}
      <button
        onClick={onToggleFiltersPanel}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
          showFiltersPanel || activeFilterCount > 0
            ? 'border-[var(--primary)]/20 bg-[var(--active-bg)] text-[var(--primary)]'
            : 'border-[var(--border-color-pro)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>{t('Filters')}</span>
        {activeFilterCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Search */}
      <div ref={searchContainerRef}>
        <SearchScopeSelector
          value={searchScope}
          onChange={onScopeChange}
          scopes={searchScopes}
          searchValue={searchInput}
          onSearchChange={onSearchInputChange}
          onSearch={onSearch}
          onClear={onClearSearch}
        />
      </div>

      <div className="flex-1" />

      {/* Total count */}
      <span className="text-xs text-[var(--text-secondary)] tabular-nums">
        {t('Total')}:{' '}
        <span className="font-semibold text-[var(--text-primary)]">{totalElements}</span>
      </span>

      <div className="h-5 w-px bg-[var(--border-color-pro)]" />

      {/* Density toggle */}
      <button
        onClick={onDensityToggle}
        className={`rounded-lg p-1.5 transition-colors ${
          isCompact
            ? 'bg-[var(--hover-bg)] text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
        }`}
        title={isCompact ? t('Comfortable view') : t('Compact view')}
      >
        <Rows3 className="h-4 w-4" />
      </button>

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] disabled:opacity-40"
        title={t('Refresh')}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </button>

      {/* Export — backend streams a UTF-8 BOM CSV that Excel opens natively. */}
      <button
        onClick={onExportAll}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-3 py-1.5 text-sm font-medium text-[var(--emerald-text)] transition-colors hover:opacity-80"
        title={t('Export to CSV')}
      >
        <FileSpreadsheet className="h-4 w-4" />
        {t('Export')}
      </button>

      {/* Column visibility popover */}
      <ColumnSettingsPopover
        columns={table
          .getAllLeafColumns()
          .filter((col) => col.id !== 'rowNumber' && col.id !== 'select')
          .map((col) => ({
            id: col.id,
            label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
            visible: col.getIsVisible(),
            canHide: col.id !== 'rowNumber' && col.id !== 'select',
          }))}
        onToggle={(columnId) => {
          const column = table.getColumn(columnId)
          if (column) column.toggleVisibility()
        }}
      />

      <div className="h-5 w-px bg-[var(--border-color-pro)]" />

      {/* Create */}
      <button
        onClick={() => navigate('/institutions/universities/create')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
      >
        <Plus className="h-4 w-4" />
        {t('Add')}
      </button>
    </div>
  )
}
