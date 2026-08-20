import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  /** Rendered BEFORE the search box — the one filter used on nearly every visit, so it is the
   *  first thing on the row. Everything rarer goes to {@link filters}. */
  leadingFilter?: ReactNode
  /** Search box (omit to hide it entirely). */
  search?: { value: string; onChange: (v: string) => void; placeholder?: string }
  /** The remaining filters — rendered OPEN on the second row, not hidden behind a button.
   *  Five controls plus a search box do not fit one line, but two lines with everything visible
   *  beat one line with the filters a click away: this grid is filtered on almost every visit. */
  filters?: ReactNode
  /** One chip per applied filter; the page owns the labels and the clearing. */
  chips?: DataTableToolbarChip[]
  onClearAll?: () => void
  /** Row count — sits on the first row, so an unfiltered grid needs no second row at all. */
  total?: number
  onRefresh?: () => void
  refreshing?: boolean
  /** Export / create buttons — rendered at the far right. */
  actions?: ReactNode
}

/**
 * Two-row table toolbar. First row: the leading filter, the search box, the row count and the page
 * actions. Second row: the remaining filters, plus a chip for anything filtered without a control
 * of its own. Replaces the three stacked bars (filters / actions / total) list pages grow into.
 *
 * <p>Why two rows and not one with a filter popover: this grid is filtered on nearly every visit,
 * and a control behind a button is a control the user has to remember exists. The count moved up
 * to the first row precisely so the second one never becomes a third.</p>
 *
 * <p>The page keeps owning its filter state: it passes the controls as {@code leadingFilter} /
 * {@code filters} and one {@link DataTableToolbarChip} per applied filter, so no filter logic
 * moves in here.</p>
 */
export function DataTableToolbar({
  leadingFilter,
  search,
  filters,
  chips = [],
  onClearAll,
  total,
  onRefresh,
  refreshing = false,
  actions,
}: DataTableToolbarProps) {
  const { t } = useTranslation()

  const searchPlaceholder = search?.placeholder ?? t('Search')
  // The count now rides on the first row, so the second row exists only for applied
  // filters — with none, the toolbar is a single line.
  const showSecondRow = filters != null || chips.length > 0

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color-pro)] px-4 py-2.5">
        {leadingFilter ? <div className="shrink-0">{leadingFilter}</div> : null}

        {/* Search takes the free space; the leading filter (if any) sits to its left */}
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

        {total != null ? (
          <span className="text-muted-foreground shrink-0 text-sm whitespace-nowrap tabular-nums">
            {t('Total')}:{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {total.toLocaleString()}
            </span>
          </span>
        ) : null}

        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {/* Second row: the remaining filters, then any chip that has no control of its own
          (e.g. a speciality picked from another page). Never a third row — the count sits above. */}
      {showSecondRow ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color-pro)] px-4 py-2">
          {filters}

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

          {onClearAll ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="ml-auto"
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
