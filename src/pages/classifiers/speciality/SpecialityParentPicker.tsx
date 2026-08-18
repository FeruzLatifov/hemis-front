import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronsUpDown, Check, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useSpecialityTree } from '@/hooks/useSpeciality'
import type { EducationTypeCode } from '@/api/speciality.api'
import { sortSpecialityNodes, flattenSpecialityTree } from './speciality-tree.util'

/** Cap the displayed parent list — a single level can hold hundreds of nodes; search narrows it. */
const MAX_OPTIONS = 100

interface Props {
  /** Which classifier tree to search (parents must share the row's education type). */
  educationType: EducationTypeCode
  /** Level of the row whose parent is picked; valid parents sit exactly one level above (childLevel - 1). */
  childLevel: number
  /** Currently-selected parent id, or null. */
  value: string | null
  onChange: (parentId: string) => void
  /** Portal target (the dialog node) so the popover list scroll-locks inside the modal. */
  container?: HTMLElement | null
  /** Only load the tree while the host dialog is open. */
  enabled?: boolean
  id?: string
}

/**
 * Searchable parent picker for a speciality row, scoped to ONE depth: it offers only the nodes that
 * sit exactly one level above the row ({@code childLevel - 1}) in the row's education-type tree. Used
 * by the edit dialog to correct a misplaced node WITHOUT changing its depth (same-level re-parent).
 * Server tree is loaded once (cached) then filtered client-side; the list is capped and searchable.
 */
export function SpecialityParentPicker({
  educationType,
  childLevel,
  value,
  onChange,
  container,
  enabled = true,
  id,
}: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const { data: tree, isLoading } = useSpecialityTree(educationType, enabled)
  // Valid parents = nodes exactly one level above the row (depth-preserving move).
  const options = useMemo(
    () =>
      flattenSpecialityTree(sortSpecialityNodes(tree ?? [])).filter(
        (o) => o.hierarchyLevel === childLevel - 1,
      ),
    [tree, childLevel],
  )
  const selected = useMemo(() => options.find((o) => o.id === value), [options, value])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const { filtered, truncated } = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q
      ? options.filter(
          (o) => o.nameUz.toLowerCase().includes(q) || (o.code ?? '').toLowerCase().includes(q),
        )
      : options
    return { filtered: base.slice(0, MAX_OPTIONS), truncated: base.length > MAX_OPTIONS }
  }, [options, search])

  const pick = (pid: string) => {
    onChange(pid)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={!value}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected
              ? `${selected.code ? selected.code + ' · ' : ''}${selected.nameUz}`
              : t('Parent speciality')}
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search parent')}
            aria-label={t('Search parent')}
            className="h-9 pl-8"
          />
        </div>
        <ul role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === o.id}
                onClick={() => pick(o.id)}
                className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
              >
                <Check
                  className={cn('h-4 w-4 shrink-0', value === o.id ? 'opacity-100' : 'opacity-0')}
                  aria-hidden="true"
                />
                {o.code ? (
                  <span className="text-muted-foreground shrink-0 font-mono text-xs">{o.code}</span>
                ) : null}
                <span className="min-w-0 flex-1 truncate">{o.nameUz}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="text-muted-foreground px-2 py-3 text-center text-sm">
              {isLoading ? t('Loading...') : t('No results found')}
            </li>
          ) : null}
          {truncated ? (
            <li className="text-muted-foreground px-2 py-2 text-center text-xs">
              {t('Refine your search to see more')}
            </li>
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

export default SpecialityParentPicker
