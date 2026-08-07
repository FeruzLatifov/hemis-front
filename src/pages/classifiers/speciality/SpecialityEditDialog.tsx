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
import { useSpecialityDetail, useSpecialityYears, useUpdateSpeciality } from '@/hooks/useSpeciality'
import type { EducationTypeCode, ReviewStatus } from '@/api/speciality.api'
import { YearMultiSelect } from './YearMultiSelect'

interface EditForm {
  code: string
  nameUz: string
  nameOz: string
  nameRu: string
  nameEn: string
  educationType: EducationTypeCode
  reviewStatus: ReviewStatus
  years: Set<number>
}

/**
 * Dedicated "edit speciality" form modal — mirrors {@link SpecialityCreateDialog}'s look & feel
 * (centered modal, header + scrollable field body + Cancel/Save footer) instead of the old inline
 * edit that was crammed into the detail dialog. Opened from the detail modal's Edit button.
 *
 * <p>Edits the same fields the API's update endpoint accepts: code, education type, the four names,
 * admission years, and review status. Parent/hierarchy placement is NOT editable here (the backend
 * update() keeps placement fixed — re-parenting is not a supported operation). Promoting
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
  const { t } = useTranslation()
  const uid = useId()
  const fieldId = (name: string) => `${uid}-${name}`
  const { data: node } = useSpecialityDetail(specialityId)
  const { data: yearOptions, isLoading: yearsLoading } = useSpecialityYears()
  const updateMutation = useUpdateSpeciality()

  const [form, setForm] = useState<EditForm | null>(null)
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

  // Years are mandatory now (backend enforces @NotEmpty) — a row can't be saved year-less.
  const canSubmit =
    !!form && form.nameUz.trim().length > 0 && form.years.size > 0 && !updateMutation.isPending

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
        className="flex max-h-[85vh] max-w-lg flex-col overflow-visible"
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
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {/* Education type — segmented, mirrors the create form. */}
              <div className="space-y-1">
                <Label htmlFor={fieldId('eduLevel')}>{t('Education type')} *</Label>
                <div id={fieldId('eduLevel')} className="grid grid-cols-2 gap-2">
                  {(['11', '12'] as const).map((lv) => (
                    <Button
                      key={lv}
                      type="button"
                      variant={form.educationType === lv ? 'default' : 'outline'}
                      aria-pressed={form.educationType === lv}
                      onClick={() => set({ educationType: lv })}
                    >
                      {lv === '11' ? t('Bachelor') : t('Master')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Review status — promoting to APPROVED is a ministry-only .approve capability
                  (backend also enforces it 403); already-approved rows keep the option enabled. */}
              <div className="space-y-1">
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

              {/* Code, then Years stacked under it (full width each) — same as create. */}
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

              {/* Names — UZ, OZ, RU, EN each full width, stacked. */}
              <div className="space-y-1">
                <Label htmlFor={fieldId('nameUz')}>{t('Name')} (UZ) *</Label>
                <Input
                  id={fieldId('nameUz')}
                  required
                  aria-required="true"
                  value={form.nameUz}
                  onChange={(e) => set({ nameUz: e.target.value })}
                />
              </div>

              <div className="space-y-1">
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
