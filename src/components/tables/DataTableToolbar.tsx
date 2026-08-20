import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface DataTableToolbarChip {
  /** Stable id — usually the filter's query-param name. */
  key: string
  /** Filter name, e.g. "Universitet". */
  label: string
  /** Human-readable selected value ("Andijon DU"), never the raw code. */
  value: string
  onRemove: () => void
}

interface DataTableToolbarProps {
  /** Search box (omit to hide it entirely). */
  search?: { value: string; onChange: (v: string) => void; placeholder?: string }
  /** Rendered inside the filter popover — the page passes its own filter controls. */
  filterContent?: ReactNode
  /** How many filters are currently applied — shown on the button, drives the popover's reset. */
  activeFilterCount?: number
  /** One chip per applied filter; the page owns the labels and the clearing. */
  chips?: DataTableToolbarChip[]
  onClearAll?: () => void
  /** Row count shown next to the chips. */
  total?: number
  onRefresh?: () => void
  refreshing?: boolean
  /** Export / create buttons — rendered at the far right. */
  actions?: ReactNode
}

/**
 * Single-row table toolbar: search on the left, a filter popover + refresh in the middle, page
 * actions on the right, and an optional chip row summarising what is currently applied. Replaces
 * the three stacked bars (filters / actions / total) list pages grow into, which stop fitting on
 * one line as soon as a fifth filter is added.
 *
 * <p>The page keeps owning its filter state: it passes the controls as {@code filterContent} and
 * one {@link DataTableToolbarChip} per applied filter, so no filter logic moves in here.</p>
 */
export function DataTableToolbar({
  search,
  filterContent,
  activeFilterCount = 0,
  chips = [],
  onClearAll,
  total,
  onRefresh,
  refreshing = false,
  actions,
}: DataTableToolbarProps) {
  const { t } = useTranslation()

  const searchPlaceholder = search?.placeholder ?? t('Search')
  const showChipRow = chips.length > 0 || total != null

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color-pro)] px-4 py-2.5">
        {/* Search — the most used control, so it leads and takes the free space */}
        {search ? (
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]"
              aria-hidden="true"
            />
            <Input
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="pl-9"
            />
          </div>
        ) : null}

        {filterContent ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="font-normal">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {activeFilterCount > 0 ? `${t('Filters')} (${activeFilterCount})` : t('Filters')}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              collisionPadding={8}
              className="max-h-[70vh] w-[300px] space-y-3 overflow-y-auto"
            >
              {filterContent}
              {activeFilterCount > 0 && onClearAll ? (
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
                    {t('Clear')}
                  </Button>
                </div>
              ) : null}
            </PopoverContent>
          </Popover>
        ) : null}

        {onRefresh ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={refreshing}
            title={t('Refresh')}
            aria-label={t('Refresh')}
            className="text-[var(--text-secondary)]"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        ) : null}

        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {/* Applied filters + row count — the count lives here rather than on a bar of its own */}
      {showChipRow ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color-pro)] px-4 py-2">
          {chips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="max-w-[220px] gap-1 py-1 pr-1 pl-2.5 font-normal"
            >
              <span className="truncate" title={`${chip.label}: ${chip.value}`}>
                {chip.label}: {chip.value}
              </span>
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={t('Remove {{label}} filter', { label: chip.label })}
                className="rounded-full p-0.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}

          {total != null ? (
            <span className="text-muted-foreground ml-auto text-sm tabular-nums">
              {t('Total')}:{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {total.toLocaleString()}
              </span>
            </span>
          ) : null}

          {chips.length > 0 && onClearAll ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className={total != null ? '' : 'ml-auto'}
            >
              {t('Clear')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

export default DataTableToolbar
