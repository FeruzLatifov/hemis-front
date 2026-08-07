import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, ChevronsUpDown, Check, Search, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  useSpecialityTree,
  useSpecialityYears,
  useCreateSpeciality,
  useSpecialityDuplicates,
} from '@/hooks/useSpeciality'
import { YearMultiSelect } from './YearMultiSelect'
import { useDebounce } from '@/hooks/useDebounce'
import type { EducationTypeCode, SpecialityNode } from '@/api/speciality.api'
import {
  sortSpecialityNodes,
  flattenSpecialityTree,
  specialityLevelKey,
  type FlatSpecialityOption,
} from './speciality-tree.util'

/** Cap the parent-picker list — 2700+ options would lag; the search input narrows it. */
const MAX_PARENT_OPTIONS = 100
/** The classifier is a fixed 4-level taxonomy (Bilim sohasi → … → Ichki yo'nalish). */
const LEVELS = [1, 2, 3, 4]

/**
 * Manual "add speciality" form (centered modal). The new row is born NEEDS_REVIEW
 * server-side, so it appears in the tree/list as "to'g'rilash kerak" until an admin
 * promotes it via the edit modal — it is not pushed to the 224 OTMs before then.
 *
 * <p>The admin picks WHICH of the 4 taxonomy levels the row is; that choice filters
 * the searchable parent picker to the level directly above (level N ⇒ parents at
 * level N-1). Level 1 (Bilim sohasi) is a root and has no parent. The backend still
 * derives hierarchyLevel from the chosen parent (null ⇒ 1), so parent and level stay
 * consistent by construction. Education level is fixed to the active tab.</p>
 */
export function SpecialityCreateDialog({
  open,
  educationType,
  parentIdDefault = null,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  /** Active tab — fixes the new row's education type ('11'=Bakalavr, '12'=Magistr); scopes the parent options. */
  educationType: EducationTypeCode
  /** Pre-selected parent (the highlighted row), or null for a top-level node. */
  parentIdDefault?: string | null
  onOpenChange: (open: boolean) => void
  /** Called after a successful create with the new node (so the page can reveal it). */
  onCreated?: (created: SpecialityNode) => void
}) {
  const { t } = useTranslation()
  const uid = useId()
  const fieldId = (name: string) => `${uid}-${name}`
  const createMutation = useCreateSpeciality()
  // Education type — defaults to the active tab, but the admin can switch it before saving.
  const [eduLevel, setEduLevel] = useState<EducationTypeCode>(educationType)
  // Load the chosen type's tree only while the dialog is open — it feeds the parent picker.
  const { data: tree, isLoading: treeLoading } = useSpecialityTree(eduLevel, open)

  const [nameUz, setNameUz] = useState('')
  const [nameOz, setNameOz] = useState('')
  const [code, setCode] = useState('')
  const [nameRu, setNameRu] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set())
  const [level, setLevel] = useState(1)
  // Admission-year options come from the classifier's own years (the year-filter's source) so the
  // picker only offers years the system actually has — no free-typed or non-existent years.
  const { data: yearOptions, isLoading: yearsLoading } = useSpecialityYears()
  const [parentId, setParentId] = useState<string | null>(null)
  const [parentOpen, setParentOpen] = useState(false)
  const [parentSearch, setParentSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  // Once we've aligned level/parent to the pre-filled selection (or the user has taken
  // control), stop the auto-init effect from overriding manual choices.
  const initedRef = useRef(false)
  // Portal target for the in-dialog popovers (parent + years): rendering them INSIDE the dialog's
  // scroll-lock subtree keeps mouse-wheel scrolling working inside their lists (portaling to <body>
  // lets react-remove-scroll swallow wheel events, leaving only scrollbar-drag).
  const [dialogNode, setDialogNode] = useState<HTMLElement | null>(null)

  // Focus the search field when the picker opens (the picker's whole purpose is to type).
  useEffect(() => {
    if (parentOpen) searchRef.current?.focus()
  }, [parentOpen])

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (!open) {
      initedRef.current = false
      return
    }
    setNameUz('')
    setNameOz('')
    setCode('')
    setNameRu('')
    setNameEn('')
    setSelectedYears(new Set())
    setParentId(null)
    setLevel(1)
    setEduLevel(educationType)
    setParentSearch('')
    setParentOpen(false)
  }, [open, educationType])

  const options = useMemo(() => flattenSpecialityTree(sortSpecialityNodes(tree ?? [])), [tree])
  const optionsById = useMemo(() => {
    const m = new Map<string, FlatSpecialityOption>()
    for (const o of options) m.set(o.id, o)
    return m
  }, [options])

  // When opened from a highlighted row, default to "add a child of it": align the level
  // to parent.level + 1 and pre-select the parent. A stale/cross-level default is dropped
  // to a top-level node. Runs once per open (after the tree loads), never over a manual edit.
  useEffect(() => {
    if (!open || initedRef.current || options.length === 0) return
    initedRef.current = true
    if (!parentIdDefault) return
    const p = optionsById.get(parentIdDefault)
    const next = (p?.hierarchyLevel ?? 0) + 1
    // Only pre-fill when the child fits the fixed 4-level taxonomy. A level-4 leaf
    // (or a stale/cross-level default) can't have a child, so we leave the top-level
    // default rather than setting an out-of-range level 5 (blank selector + bad data).
    if (p && next <= LEVELS.length) {
      setLevel(next)
      setParentId(parentIdDefault)
    }
  }, [open, options.length, optionsById, parentIdDefault])

  // Parents valid for the chosen level are exactly the nodes one level above.
  const parentOptions = useMemo(
    () => options.filter((o) => o.hierarchyLevel === level - 1),
    [options, level],
  )

  // Drop a parent that no longer fits the chosen level (safety net for the pre-fill path).
  useEffect(() => {
    if (level > 1 && parentId && options.length > 0) {
      const p = optionsById.get(parentId)
      if (!p || (p.hierarchyLevel ?? 0) + 1 !== level) setParentId(null)
    }
  }, [level, parentId, options.length, optionsById])

  const changeLevel = (n: number) => {
    initedRef.current = true // user is driving now
    setLevel(n)
    setParentId(null) // the valid-parent set changed — force a fresh pick (root for level 1)
  }

  // Switching education type reloads the parent tree for the other level, so drop any
  // picked parent (it belongs to the old level's tree). Level 1–4 stay valid for both.
  const changeEduLevel = (lv: EducationTypeCode) => {
    if (lv === eduLevel) return
    initedRef.current = true // user is driving now
    setEduLevel(lv)
    setParentId(null)
  }

  const selectedParent = parentId ? optionsById.get(parentId) : undefined

  const { filtered, truncated } = useMemo(() => {
    const q = parentSearch.trim().toLowerCase()
    const base = q
      ? parentOptions.filter(
          (o) => o.nameUz.toLowerCase().includes(q) || (o.code ?? '').toLowerCase().includes(q),
        )
      : parentOptions
    return {
      filtered: base.slice(0, MAX_PARENT_OPTIONS),
      truncated: base.length > MAX_PARENT_OPTIONS,
    }
  }, [parentOptions, parentSearch])

  const selectParent = (id: string) => {
    initedRef.current = true
    setParentId(id)
    setParentOpen(false)
    setParentSearch('')
  }

  const needsParent = level > 1

  // Advisory "already exists" check — debounced code/name lookup, scoped to the tab; a match under
  // the picked parent is flagged as a sibling collision. Warns only, never blocks the create.
  const debouncedCode = useDebounce(code, 400)
  const debouncedName = useDebounce(nameUz, 400)
  // Gate on the LIVE input too (not just the debounced value): the component stays mounted across
  // close/reopen, so the debounced value + cached result outlive an emptied/reset field — without
  // this, a stale banner would flash for ~400ms over a blank Code on reopen or after clearing.
  const liveHasInput = code.trim().length > 0 || nameUz.trim().length > 0
  const { data: dup } = useSpecialityDuplicates(
    {
      code: debouncedCode.trim() || undefined,
      name: debouncedName.trim() || undefined,
      educationType: eduLevel,
      parentId: parentId ?? undefined,
    },
    open && liveHasInput && (debouncedCode.trim().length > 0 || debouncedName.trim().length > 0),
  )
  const hasDup = liveHasInput && !!dup && (dup.codeExists || dup.nameExists)
  // Chosen edition years — drives the year-aware merge/duplicate logic below.
  const enteredYears = selectedYears
  // An exact twin = an existing row with the SAME code AND name. Adding a NEW year to it just merges
  // (server-side) the year into that row; re-adding a year it already has (or adding none) is a real
  // duplicate and is blocked. Code-only / name-only overlaps stay advisory.
  const hasTwin = liveHasInput && !!dup && dup.exactDuplicate
  const twinYears = new Set(
    (dup?.matches ?? []).filter((m) => m.codeMatch && m.nameMatch).flatMap((m) => m.years ?? []),
  )
  const addsNewYear = [...enteredYears].some((y) => !twinYears.has(y))
  const willMerge = hasTwin && addsNewYear // new edition year → server merges it into the existing row
  const blockedDup = hasTwin && !addsNewYear // nothing new to add → a true duplicate
  // Blocked duplicate → red; a merge hint or an advisory near-match → amber.
  const dupTone = blockedDup
    ? {
        box: 'border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10',
        head: 'text-red-800 dark:text-red-300',
        item: 'text-red-700 dark:text-red-400',
        foot: 'text-red-700 dark:text-red-400',
      }
    : {
        box: 'border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10',
        head: 'text-amber-800 dark:text-amber-300',
        item: 'text-amber-700 dark:text-amber-400',
        foot: 'text-amber-700/80 dark:text-amber-400/80',
      }
  const canSubmit =
    nameUz.trim().length > 0 &&
    selectedYears.size > 0 &&
    !(needsParent && !parentId) &&
    !blockedDup &&
    !createMutation.isPending

  const handleSubmit = () => {
    if (!canSubmit) return
    const parsedYears = [...selectedYears]
    // Level 1 is a root (no parent); level 2–4 carry the picked parent. The backend
    // derives hierarchyLevel from parent, so this stays consistent with the selector.
    createMutation.mutate(
      {
        code: code.trim() || undefined,
        nameUz: nameUz.trim(),
        nameOz: nameOz.trim() || undefined,
        nameRu: nameRu.trim() || undefined,
        nameEn: nameEn.trim() || undefined,
        educationType: eduLevel,
        parentId: needsParent ? (parentId ?? undefined) : undefined,
        years: parsedYears.length > 0 ? parsedYears : undefined,
      },
      {
        onSuccess: (created) => {
          onOpenChange(false)
          onCreated?.(created)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* flex column so the header/footer stay put and only the field body scrolls; overflow-visible
          (not auto) lets the in-dialog popovers float past the modal edge instead of stretching it. */}
      <DialogContent
        ref={(el) => setDialogNode(el)}
        className="flex max-h-[85vh] max-w-lg flex-col overflow-visible"
      >
        <DialogHeader className="shrink-0">
          <div className="flex items-start gap-2 pr-6">
            <GraduationCap className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <DialogTitle>{t('Add speciality')}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {eduLevel === '11' ? t('Bachelor') : t('Master')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {/* Advisory duplicate warning — the code/name already exists. Never blocks; the admin
                decides (code is intentionally non-unique in the classifier). */}
            {hasDup && dup ? (
              <div className={cn('rounded-md border p-3', dupTone.box)}>
                <p className={cn('text-sm font-medium', dupTone.head)}>
                  {dup.codeExists && dup.nameExists
                    ? t('This code and name already exist')
                    : dup.codeExists
                      ? t('This code already exists')
                      : t('This name already exists')}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {dup.matches.slice(0, 5).map((m) => {
                    const lk = specialityLevelKey(m.hierarchyLevel)
                    return (
                      <li
                        key={m.id}
                        className={cn(
                          'flex flex-wrap items-center gap-x-1.5 text-xs',
                          dupTone.item,
                        )}
                      >
                        {m.code ? <span className="font-mono">{m.code}</span> : null}
                        <span className="max-w-[220px] truncate">{m.nameUz}</span>
                        {lk ? <span className="opacity-70">· {t(lk)}</span> : null}
                        {m.years && m.years.length > 0 ? (
                          <span className="opacity-70">· {m.years.join(', ')}</span>
                        ) : null}
                        {m.sameParent ? (
                          <span className="font-medium">· {t('Same parent')}</span>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
                <p className={cn('mt-1.5 text-xs', blockedDup ? 'font-medium' : '', dupTone.foot)}>
                  {blockedDup
                    ? t('Cannot add a duplicate')
                    : willMerge
                      ? t('The year will be added to the existing entry')
                      : t('You can still create it')}
                </p>
              </div>
            ) : null}

            {/* Education type — pre-set to the active tab; the admin may switch before saving.
                Whichever tab the dialog was opened from is auto-selected here. */}
            <div className="space-y-1">
              <Label htmlFor={fieldId('eduLevel')}>{t('Education type')} *</Label>
              <div id={fieldId('eduLevel')} className="grid grid-cols-2 gap-2">
                {(['11', '12'] as const).map((lv) => (
                  <Button
                    key={lv}
                    type="button"
                    variant={eduLevel === lv ? 'default' : 'outline'}
                    aria-pressed={eduLevel === lv}
                    onClick={() => changeEduLevel(lv)}
                  >
                    {lv === '11' ? t('Bachelor') : t('Master')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Level selector — marks which of the 4 taxonomy levels the new row is. */}
            <div className="space-y-1">
              <Label htmlFor={fieldId('level')}>{t('Hierarchy level')} *</Label>
              <Select value={String(level)} onValueChange={(v) => changeLevel(Number(v))}>
                <SelectTrigger id={fieldId('level')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((n) => {
                    const k = specialityLevelKey(n)
                    return (
                      <SelectItem key={n} value={String(n)}>
                        {k ? `${n} — ${t(k)}` : n}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Parent — required for level 2–4, filtered to the level directly above.
                Level 1 (Bilim sohasi) is a root, so it has no parent. */}
            {needsParent ? (
              <div className="space-y-1">
                <Label htmlFor={fieldId('parent')}>{t('Parent speciality')} *</Label>
                <Popover open={parentOpen} onOpenChange={setParentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id={fieldId('parent')}
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={parentOpen}
                      aria-controls={fieldId('parent-listbox')}
                      aria-required="true"
                      aria-invalid={!parentId}
                      className="w-full justify-between font-normal"
                    >
                      <span className={cn('truncate', !selectedParent && 'text-muted-foreground')}>
                        {selectedParent
                          ? `${selectedParent.code ? selectedParent.code + ' · ' : ''}${selectedParent.nameUz}`
                          : t('Parent speciality')}
                      </span>
                      <ChevronsUpDown
                        className="ml-2 h-4 w-4 shrink-0 opacity-50"
                        aria-hidden="true"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    container={dialogNode}
                    className="flex max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] flex-col p-0"
                    align="start"
                    collisionPadding={8}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="relative shrink-0 border-b p-2">
                      <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                      <Input
                        ref={searchRef}
                        value={parentSearch}
                        onChange={(e) => setParentSearch(e.target.value)}
                        placeholder={t('Search parent')}
                        aria-label={t('Search parent')}
                        className="h-9 pl-8"
                      />
                    </div>
                    <ul
                      id={fieldId('parent-listbox')}
                      role="listbox"
                      className="min-h-0 flex-1 overflow-y-auto p-1"
                    >
                      {filtered.map((o) => (
                        <li key={o.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={parentId === o.id}
                            onClick={() => selectParent(o.id)}
                            className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
                          >
                            <Check
                              className={cn(
                                'h-4 w-4 shrink-0',
                                parentId === o.id ? 'opacity-100' : 'opacity-0',
                              )}
                              aria-hidden="true"
                            />
                            {o.code ? (
                              <span className="text-muted-foreground shrink-0 font-mono text-xs">
                                {o.code}
                              </span>
                            ) : null}
                            <span className="min-w-0 flex-1 truncate">{o.nameUz}</span>
                          </button>
                        </li>
                      ))}
                      {filtered.length === 0 ? (
                        <li className="text-muted-foreground px-2 py-3 text-center text-sm">
                          {treeLoading ? t('Loading...') : t('No results found')}
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
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">{t('Top level')}</p>
            )}

            {/* Code first, then Years stacked directly under it (full width each). */}
            <div className="space-y-1">
              <Label htmlFor={fieldId('code')}>{t('Code')}</Label>
              <Input id={fieldId('code')} value={code} onChange={(e) => setCode(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor={fieldId('years')}>{t('Years')} *</Label>
              <YearMultiSelect
                id={fieldId('years')}
                container={dialogNode}
                options={yearOptions ?? []}
                selected={selectedYears}
                onChange={setSelectedYears}
                loading={yearsLoading}
              />
              {selectedYears.size === 0 ? (
                <p className="text-muted-foreground text-xs">
                  {t('At least one year is required')}
                </p>
              ) : null}
            </div>

            {/* Names — UZ, OZ, RU, EN each full width, stacked (long names stay readable). */}
            <div className="space-y-1">
              <Label htmlFor={fieldId('nameUz')}>{t('Name')} (UZ) *</Label>
              <Input
                id={fieldId('nameUz')}
                required
                aria-required="true"
                value={nameUz}
                onChange={(e) => setNameUz(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={fieldId('nameOz')}>{t('Name')} (OZ)</Label>
              <Input
                id={fieldId('nameOz')}
                value={nameOz}
                onChange={(e) => setNameOz(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={fieldId('nameRu')}>{t('Name')} (RU)</Label>
              <Input
                id={fieldId('nameRu')}
                value={nameRu}
                onChange={(e) => setNameRu(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={fieldId('nameEn')}>{t('Name')} (EN)</Label>
              <Input
                id={fieldId('nameEn')}
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SpecialityCreateDialog
