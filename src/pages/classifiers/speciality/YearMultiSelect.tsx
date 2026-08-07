import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Admission-year multi-select backed by the classifier's OWN years (no free text): the admin can
 * only pick years the system actually has, so a create can't carry a typo'd or non-existent year.
 * Years are a growing dataset, so the popover has a search box + "select all (filtered)" / "clear",
 * mirroring the parent picker. Options render newest-first; the value is the Set of chosen years.
 * The check indicator is a plain <span> (not a Radix Checkbox, which is a <button>) so it can nest
 * inside the option button.
 */
export function YearMultiSelect({
  id,
  container,
  options,
  selected,
  onChange,
  loading = false,
  disabled = false,
}: {
  id?: string
  /** Portal target — pass the dialog node so the popover's wheel-scroll works inside a modal. */
  container?: HTMLElement | null
  options: number[]
  selected: Set<number>
  onChange: (next: Set<number>) => void
  loading?: boolean
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const listboxId = `${useId()}-year-listbox`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const sorted = useMemo(() => [...options].sort((a, b) => b - a), [options]) // newest first
  const filtered = useMemo(() => {
    const q = query.trim()
    return q ? sorted.filter((y) => String(y).includes(q)) : sorted
  }, [sorted, query])
  const chosen = [...selected].sort((a, b) => b - a)

  // Focus the search when the popover opens; reset the query when it closes.
  useEffect(() => {
    if (open) searchRef.current?.focus()
    else setQuery('')
  }, [open])

  const toggle = (year: number) => {
    const next = new Set(selected)
    if (next.has(year)) next.delete(year)
    else next.add(year)
    onChange(next)
  }
  const selectAllFiltered = () => {
    const next = new Set(selected)
    for (const y of filtered) next.add(y)
    onChange(next)
  }
  const clearAll = () => onChange(new Set())

  const allFilteredSelected = filtered.length > 0 && filtered.every((y) => selected.has(y))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', chosen.length === 0 && 'text-muted-foreground')}>
            {chosen.length > 0 ? chosen.join(', ') : t('Select years')}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        container={container}
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] flex-col p-0"
        align="start"
        collisionPadding={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="relative shrink-0 border-b p-2">
          <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search')}
            aria-label={t('Search')}
            inputMode="numeric"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex shrink-0 items-center justify-between border-b px-2 py-1.5 text-xs">
          <button
            type="button"
            onClick={selectAllFiltered}
            disabled={allFilteredSelected || filtered.length === 0}
            className="text-primary font-medium disabled:opacity-40"
          >
            {t('Select all')}
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={selected.size === 0}
            className="text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            {t('Clear')}
          </button>
        </div>
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={t('Years')}
          className="min-h-0 flex-1 overflow-y-auto p-1"
        >
          {filtered.map((year) => {
            const checked = selected.has(year)
            return (
              <li key={year}>
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(year)}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input',
                    )}
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span>{year}</span>
                </button>
              </li>
            )
          })}
          {filtered.length === 0 ? (
            <li className="text-muted-foreground px-2 py-3 text-center text-sm">
              {loading ? t('Loading...') : t('No results found')}
            </li>
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

export default YearMultiSelect
