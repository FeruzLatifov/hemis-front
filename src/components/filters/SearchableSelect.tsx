import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronsUpDown, Check, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  code: string
  name: string
}

interface SearchableSelectProps {
  /** Selected option code, or {@link ALL_VALUE} for "no filter". */
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  /** Filter name shown on the trigger while nothing is selected (e.g. "Universitet"). */
  placeholder: string
  /** Label of the reset / "no filter" item at the top of the list (e.g. "Barchasi"). */
  allLabel: string
  searchPlaceholder: string
  /** Shown when the search matches nothing. */
  emptyLabel?: string
  className?: string
  /** Show the search input. Default true; pass false for short lists that need no type-to-search. */
  searchable?: boolean
}

export const ALL_VALUE = 'all'

/**
 * Searchable single-select filter: Popover + a search input + a filtered list. The search matches
 * on BOTH the option code AND name, so the user can type either. A top reset item clears the filter;
 * the trigger shows the filter name until a value is picked, then "code — name".
 *
 * <p>Built on the in-repo Popover primitive (no cmdk dependency) — mirrors the
 * SpecialityCreateDialog parent picker. Suited to long option lists (e.g. ~98 universities) where a
 * plain {@code <Select>} has no real type-to-search.</p>
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  searchPlaceholder,
  emptyLabel,
  className,
  searchable = true,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setSearch('')
    if (!searchable) return
    // Focus the search field when the picker opens — typing is its whole purpose.
    const id = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open, searchable])

  const selected = value !== ALL_VALUE ? options.find((o) => o.code === value) : undefined

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q),
    )
  }, [options, search])

  const select = (v: string) => {
    onChange(v)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between font-normal', className)}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? `${selected.code} — ${selected.name}` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[min(92vw,560px)] min-w-[var(--radix-popover-trigger-width)] flex-col p-0"
        align="start"
        collisionPadding={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {searchable ? (
          <div className="relative shrink-0 border-b p-2">
            <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-9 pl-8"
            />
          </div>
        ) : null}
        <ul role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1">
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === ALL_VALUE}
              onClick={() => select(ALL_VALUE)}
              className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
            >
              <Check
                className={cn(
                  'h-4 w-4 shrink-0',
                  value === ALL_VALUE ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">{allLabel}</span>
            </button>
          </li>
          {filtered.map((o) => (
            <li key={o.code}>
              <button
                type="button"
                role="option"
                aria-selected={value === o.code}
                onClick={() => select(o.code)}
                className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
              >
                <Check
                  className={cn('h-4 w-4 shrink-0', value === o.code ? 'opacity-100' : 'opacity-0')}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground shrink-0 font-mono text-xs">{o.code}</span>
                <span className="min-w-0 flex-1 break-words">{o.name}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && emptyLabel ? (
            <li className="text-muted-foreground px-2 py-6 text-center text-sm">{emptyLabel}</li>
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
