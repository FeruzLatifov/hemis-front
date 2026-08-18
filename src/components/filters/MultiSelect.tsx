import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
}

/**
 * Generic searchable multi-select (code/label options) — the same look-and-feel as
 * {@link ../../pages/classifiers/speciality/YearMultiSelect} but for arbitrary `{ value, label }`
 * options: a trigger listing the chosen labels, a search box, "select all (filtered)" / "clear",
 * and checkbox rows. The check indicator is a plain <span> (not a Radix Checkbox, a <button>) so it
 * can nest inside the option button. Pass `container` (the dialog node) to portal the popover inside
 * a modal so wheel-scroll works.
 */
export function MultiSelect({
  id,
  container,
  options,
  selected,
  onChange,
  placeholder,
  searchPlaceholder,
  searchable = true,
  loading = false,
  disabled = false,
}: {
  id?: string
  /** Portal target — pass the dialog node so the popover's wheel-scroll works inside a modal. */
  container?: HTMLElement | null
  options: MultiSelectOption[]
  selected: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  /** Show the search input. Default true; pass false for short lists that need no type-to-search. */
  searchable?: boolean
  loading?: boolean
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const listboxId = `${useId()}-multi-listbox`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? options.filter(
          (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
        )
      : options
  }, [options, query])
  const chosenLabels = useMemo(
    () => options.filter((o) => selectedSet.has(o.value)).map((o) => o.label),
    [options, selectedSet],
  )

  // Focus the search when the popover opens; reset the query when it closes.
  useEffect(() => {
    if (open) {
      if (searchable) searchRef.current?.focus()
    } else setQuery('')
  }, [open, searchable])

  const toggle = (value: string) => {
    const next = new Set(selectedSet)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange([...next])
  }
  const selectAllFiltered = () => {
    const next = new Set(selectedSet)
    for (const o of filtered) next.add(o.value)
    onChange([...next])
  }
  const clearAll = () => onChange([])

  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selectedSet.has(o.value))

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
          <span className={cn('truncate', chosenLabels.length === 0 && 'text-muted-foreground')}>
            {chosenLabels.length > 0 ? chosenLabels.join(', ') : (placeholder ?? t('Select'))}
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
        {searchable ? (
          <div className="relative shrink-0 border-b p-2">
            <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder ?? t('Search')}
              aria-label={t('Search')}
              className="h-9 pl-8"
            />
          </div>
        ) : null}
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
            disabled={selectedSet.size === 0}
            className="text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            {t('Clear')}
          </button>
        </div>
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          className="min-h-0 flex-1 overflow-y-auto p-1"
        >
          {filtered.map((o) => {
            const checked = selectedSet.has(o.value)
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(o.value)}
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
                  <span className="truncate">{o.label}</span>
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

export default MultiSelect
