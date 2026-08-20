import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useSpecialityDetail,
  useSpecialityYears,
  useSpecialityEducationTypes,
  useUpdateSpeciality,
} from '@/hooks/useSpeciality'
import { classifierLabel } from '@/api/speciality.api'
import type { EducationTypeCode, ReviewStatus } from '@/api/speciality.api'
import { YearMultiSelect } from './YearMultiSelect'
import { SpecialityParentPicker } from './SpecialityParentPicker'
import { specialityLevelKey } from './speciality-tree.util'

/** The classifier is a fixed 4-level taxonomy (Bilim sohasi → … → Ichki yo'nalish). */
const LEVELS = [1, 2, 3, 4]

interface EditForm {
  code: string
  nameUz: string
  nameOz: string
  nameRu: string
  nameEn: string
  educationType: EducationTypeCode
  reviewStatus: ReviewStatus
  /** Chosen depth (1-4) — mirrors the create form; drives the parent picker + re-placement. */
  level: number
  /** Parent for a level 2-4 row. Empty for a top-level (level 1) row. */
  parentId: string
  years: Set<number>
}

/**
 * Dedicated "edit speciality" form modal — mirrors {@link SpecialityCreateDialog}'s look & feel
 * (centered modal, header + scrollable field body + Cancel/Save footer) instead of the old inline
 * edit that was crammed into the detail dialog. Opened from the detail modal's Edit button.
 *
 * <p>Edits the same fields the API's update endpoint accepts: code, education type, the four names,
 * admission years, review status, and — mirroring the create form — the row's placement (hierarchy
 * level + parent), so a misplaced node can be re-placed instead of deleted and recreated. A row that
 * still has sub-directions has its level LOCKED (its children must be moved out first); a childless
 * row moves freely. Any successful move drops the row to NEEDS_REVIEW server-side. Promoting
 * NEEDS_REVIEW → APPROVED needs the dedicated `.approve` permission (`canApprove`); the backend
 * enforces it too.</p>
 */
export function SpecialityEditDialog({
  open,
  specialityId,
  canApprove,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  /** Row to edit; `null` keeps the dialog closed. */
  specialityId: string | null
  /** Whether the user may promote NEEDS_REVIEW → APPROVED (dedicated .approve permission). */
  canApprove: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful save with the edited id (so the page can re-show it). */
  onSaved?: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const uid = useId()
  const fieldId = (name: string) => `${uid}-${name}`
  const { data: node } = useSpecialityDetail(specialityId)
  const { data: yearOptions, isLoading: yearsLoading } = useSpecialityYears()
  const updateMutation = useUpdateSpeciality()
  // Ta'lim turi options from the h_education_type classifier (Bakalavr/Magistr) — mirrors the create
  // form. The endpoint already scopes to the two codes this classifier admits.
  const { data: eduTypeOptions = [] } = useSpecialityEducationTypes()

  const [form, setForm] = useState<EditForm | null>(null)
  // Selected education-type option (for the never-blank trigger label; falls back to Bachelor/Master).
  const selectedEduType = eduTypeOptions.find((o) => o.code === form?.educationType)
  // Placement mirrors the create form: the chosen depth (form.level) decides whether a parent is
  // required (level 2-4) and which level the parent picker offers (form.level - 1).
  const needsParent = (form?.level ?? 1) > 1
  // A row that still has sub-directions (active children) can't change its own level — moving it
  // would drag the whole subtree. The backend blocks it (422, SPECIALITY_HAS_CHILDREN_MOVE_FIRST);
  // we lock the level selector up front and explain why, so the user re-places the children first
  // instead of hitting the error. Same-level re-parent stays allowed, so the parent picker is not
  // touched. `node.children` is the direct-child list the detail endpoint returns.
  const hasChildren = (node?.children?.length ?? 0) > 0
  // Portal target for the year picker popover — rendering inside the dialog keeps wheel-scroll working.
  const [dialogNode, setDialogNode] = useState<HTMLElement | null>(null)
  // Confirm step: changing years is a full replace (delete-then-insert server-side), so we ask first.
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Init the form once per (open, node) — guarding on the id so a background refetch of the same
  // node never clobbers in-progress edits, and a different node (breadcrumb → edit) re-inits.
  const initedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) {
      initedIdRef.current = null
      setForm(null)
      return
    }
    if (node && initedIdRef.current !== node.id) {
      initedIdRef.current = node.id
      setForm({
        code: node.code ?? '',
        nameUz: node.nameUz,
        nameOz: node.nameOz ?? '',
        nameRu: node.nameRu ?? '',
        nameEn: node.nameEn ?? '',
        educationType: node.educationType as EducationTypeCode,
        reviewStatus: node.reviewStatus,
        level: node.hierarchyLevel ?? 1,
        parentId: node.parentId ?? '',
        years: new Set(node.years ?? []),
      })
    }
  }, [open, node])

  const set = (patch: Partial<EditForm>) => setForm((f) => (f ? { ...f, ...patch } : f))

  // Offer every classifier year PLUS the row's own years, so an already-attached year that is not
  // in the global option list (edge case) stays selectable instead of being silently dropped on save.
  const yearOptionList = useMemo(() => {
    const s = new Set<number>(yearOptions ?? [])
    for (const y of node?.years ?? []) s.add(y)
    return [...s]
  }, [yearOptions, node])

  // Diff the edited years against the saved set — a change triggers a confirm (the save
  // REPLACES the whole set: delete-then-insert), an unchanged set saves straight through.
  const yearDiff = useMemo(() => {
    const original = new Set(node?.years ?? [])
    const current = form?.years ?? new Set<number>()
    const added = [...current].filter((y) => !original.has(y)).sort((a, b) => a - b)
    const removed = [...original].filter((y) => !current.has(y)).sort((a, b) => a - b)
    return { added, removed, changed: added.length > 0 || removed.length > 0 }
  }, [node, form])

  // Years are mandatory now (backend enforces @NotEmpty) — a row can't be saved year-less. A level 2-4
  // row must keep a parent (blank only happens after switching education type — force a re-pick).
  const canSubmit =
    !!form &&
    form.nameUz.trim().length > 0 &&
    form.years.size > 0 &&
    (!needsParent || !!form.parentId) &&
    !updateMutation.isPending

  const doSave = () => {
    if (!canSubmit || !specialityId || !form) return
    updateMutation.mutate(
      {
        id: specialityId,
        payload: {
          code: form.code.trim() || undefined,
          nameUz: form.nameUz.trim(),
          nameOz: form.nameOz.trim() || undefined,
          nameRu: form.nameRu.trim() || undefined,
          nameEn: form.nameEn.trim() || undefined,
          educationType: form.educationType,
          reviewStatus: form.reviewStatus,
          // Placement — same shape as create: depth + parent (parent omitted for a level-1 root).
          // Backend no-ops if unchanged, else re-places the row and drops it to NEEDS_REVIEW; a level
          // change on a row with children is rejected (422) — the level control is locked to prevent it.
          hierarchyLevel: form.level,
          parentId: needsParent ? form.parentId : undefined,
          years: [...form.years],
        },
      },
      {
        onSuccess: () => {
          setConfirmOpen(false)
          onOpenChange(false)
          onSaved?.(specialityId)
        },
      },
    )
  }

  const handleSubmit = () => {
    if (!canSubmit || !specialityId || !form) return
    if (yearDiff.changed) setConfirmOpen(true)
    else doSave()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Same shell as the create dialog: flex column (header/footer fixed, body scrolls),
          overflow-visible so the year popover can float past the edge instead of stretching it. */}
      <DialogContent
        ref={(el) => setDialogNode(el)}
        className="flex max-h-[90vh] w-[95vw] flex-col overflow-visible sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0">
          <div className="flex items-start gap-2 pr-6">
            <GraduationCap className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="leading-snug break-words">
                {node?.nameUz ?? t('Speciality')}
              </DialogTitle>
              <DialogDescription className="mt-0.5">{t('Edit')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {form ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Uniform 2-column grid (single column on mobile): short fields sit side-by-side, wide
                ones (duplicate warning, parent picker, top-level note) span both columns.
            
                -mx-6/px-6 + py-1: a scroll box clips whatever is painted outside it, and a focused
                field paints a 3px halo outside its border. Bleeding to the dialog's own padding and
                padding back gives that halo room on every edge — without it the first column's halo
                was sliced off flat against the left edge. */}
            <div className="-mx-6 grid min-h-0 flex-1 grid-cols-1 gap-x-4 gap-y-4 overflow-y-auto px-6 py-1 [scrollbar-gutter:stable] sm:grid-cols-2">
              {/* Education type — dropdown fed by the h_education_type classifier, mirrors create. */}
              <div className="space-y-1">
                <Label htmlFor={fieldId('eduType')}>{t('Education type')} *</Label>
                <Select
                  value={form.educationType}
                  onValueChange={(v) =>
                    // Switching type moves the row to the other tree — its old parent is now invalid,
                    // so drop it and force a re-pick from the new type's parents.
                    set({ educationType: v as EducationTypeCode, parentId: '' })
                  }
                >
                  <SelectTrigger id={fieldId('eduType')} className="w-full">
                    {/* Render the label ourselves so the trigger is never a blank box before the
                        options load, or if the classifier has no active 11/12 row. */}
                    <SelectValue placeholder={t('Education type')}>
                      {selectedEduType
                        ? classifierLabel(selectedEduType, i18n.language)
                        : form.educationType === '11'
                          ? t('Bachelor')
                          : t('Master')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {eduTypeOptions.map((o) => (
                      <SelectItem key={o.code} value={o.code}>
                        {classifierLabel(o, i18n.language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hierarchy level — same selector as the create form. Changing the depth re-derives the
                  valid parents (one level above) and drops the current parent for a fresh pick. LOCKED
                  while the row still has sub-directions (hasChildren): the children must be re-placed
                  first, so we disable the control and say why instead of letting the save 422. */}
              <div className="space-y-1">
                <Label htmlFor={fieldId('level')}>{t('Hierarchy level')} *</Label>
                <Select
                  value={String(form.level)}
                  disabled={hasChildren}
                  onValueChange={(v) => set({ level: Number(v), parentId: '' })}
                >
                  <SelectTrigger id={fieldId('level')} className="w-full">
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
                {hasChildren ? (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    {t(
                      'Has sub-directions — move them to another level first to change this level',
                    )}
                  </p>
                ) : null}
                {/* Reset hint is INDEPENDENT of hasChildren: a row with children still allows a
                    same-level re-parent (the parent picker stays enabled), which also demotes an
                    APPROVED row to NEEDS_REVIEW and retracts it from the OTMs — so warn whenever the
                    row is currently APPROVED, not only for childless rows. */}
                {node?.reviewStatus === 'APPROVED' ? (
                  <p className="text-muted-foreground text-xs">
                    {t('Moving to another place resets the status to Needs review')}
                  </p>
                ) : null}
              </div>

              {/* Review status — promoting to APPROVED is a ministry-only .approve capability
                  (backend also enforces it 403); already-approved rows keep the option enabled. */}
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={fieldId('reviewStatus')}>{t('Review status')}</Label>
                <Select
                  value={form.reviewStatus}
                  onValueChange={(v) => set({ reviewStatus: v as ReviewStatus })}
                >
                  <SelectTrigger id={fieldId('reviewStatus')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="APPROVED"
                      disabled={!canApprove && node?.reviewStatus !== 'APPROVED'}
                    >
                      {t('Approved')}
                    </SelectItem>
                    <SelectItem value="NEEDS_REVIEW">{t('Needs review')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Parent — the nodes one level above the chosen depth (mirrors create). Fixes a
                  misplaced row; the backend cascades any depth change to descendants. Level 1 is a
                  root with no parent. */}
              {needsParent ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor={fieldId('parent')}>{t('Parent speciality')} *</Label>
                  <SpecialityParentPicker
                    id={fieldId('parent')}
                    educationType={form.educationType}
                    childLevel={form.level}
                    value={form.parentId || null}
                    onChange={(pid) => set({ parentId: pid })}
                    container={dialogNode}
                    enabled={open}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-xs sm:col-span-2">{t('Top level')}</p>
              )}

              {/* Code and Years share a row — same grid as create. */}
              <div className="space-y-1">
                <Label htmlFor={fieldId('code')}>{t('Code')}</Label>
                <Input
                  id={fieldId('code')}
                  value={form.code}
                  onChange={(e) => set({ code: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={fieldId('years')}>{t('Years')} *</Label>
                <YearMultiSelect
                  id={fieldId('years')}
                  container={dialogNode}
                  options={yearOptionList}
                  selected={form.years}
                  onChange={(next) => set({ years: next })}
                  loading={yearsLoading}
                />
                {form.years.size === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    {t('At least one year is required')}
                  </p>
                ) : null}
              </div>

              {/* Names: UZ + OZ stay full width — they carry the real name and run long.
                  RU/EN pair up on one row: they are usually short or empty, and a row each
                  was what pushed this dialog past the viewport. */}
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={fieldId('nameUz')}>{t('Name')} (UZ) *</Label>
                <Input
                  id={fieldId('nameUz')}
                  required
                  aria-required="true"
                  value={form.nameUz}
                  onChange={(e) => set({ nameUz: e.target.value })}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={fieldId('nameOz')}>{t('Name')} (OZ)</Label>
                <Input
                  id={fieldId('nameOz')}
                  value={form.nameOz}
                  onChange={(e) => set({ nameOz: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={fieldId('nameRu')}>{t('Name')} (RU)</Label>
                <Input
                  id={fieldId('nameRu')}
                  value={form.nameRu}
                  onChange={(e) => set({ nameRu: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={fieldId('nameEn')}>{t('Name')} (EN)</Label>
                <Input
                  id={fieldId('nameEn')}
                  value={form.nameEn}
                  onChange={(e) => set({ nameEn: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="mt-4 shrink-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          // Detail still loading — a short spacer keeps the modal from collapsing to header-only.
          <div className="min-h-40" aria-hidden="true" />
        )}

        {/* Confirm a year change before the destructive replace (delete-then-insert). */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('Change admission years?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('The current years will be replaced with the selected ones.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1 text-sm">
              {yearDiff.added.length > 0 ? (
                <p>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {t('Added')}:
                  </span>{' '}
                  {yearDiff.added.join(', ')}
                </p>
              ) : null}
              {yearDiff.removed.length > 0 ? (
                <p>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {t('Removed')}:
                  </span>{' '}
                  {yearDiff.removed.join(', ')}
                </p>
              ) : null}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={doSave} disabled={updateMutation.isPending}>
                {t('Confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}

export default SpecialityEditDialog
