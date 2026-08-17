import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Check, ChevronsUpDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SearchableSelect, ALL_VALUE } from '@/components/filters/SearchableSelect'
import { useDebounce } from '@/hooks/useDebounce'
import { useSpecialityList, useSpecialityYears } from '@/hooks/useSpeciality'
import { useUpdateSpecialityAttachment, useEducationForms } from '@/hooks/useSpecialityAttachments'
import { specialityLevelKey } from '@/pages/classifiers/speciality/speciality-tree.util'
import type { EducationTypeCode, SpecialityRow } from '@/api/speciality.api'
import { classifierLabel } from '@/api/specialityAttachments.api'
import type { SpecialityAttachmentRow } from '@/api/specialityAttachments.api'

// Education form is NOT hard-coded — loaded from the h_education_form classifier (useEducationForms).
// Faol/Nofaol toggle → the entity status. ACTIVE = Faol, SUSPENDED = Nofaol (REVOKED is folded into Nofaol).
const STATUSES: { code: string; labelKey: string }[] = [
  { code: 'ACTIVE', labelKey: 'Active' },
  { code: 'SUSPENDED', labelKey: 'Inactive' },
]

interface Props {
  /** The attachment being edited; null closes the dialog. */
  row: SpecialityAttachmentRow | null
  onOpenChange: (open: boolean) => void
}

/**
 * Edit an existing speciality→OTM attachment. The UNIVERSITY and EDUCATION TYPE are fixed
 * (read-only): re-assigning them would be a new attachment, not an edit. Editable: education year,
 * speciality (searched within the fixed education type + selected year), education form, and status
 * (Faol/Nofaol). On success the parent list refetches.
 */
export function SpecialityAttachmentEditDialog({ row, onOpenChange }: Props) {
  const { t, i18n } = useTranslation()
  const updateMutation = useUpdateSpecialityAttachment()
  const { data: educationForms = [] } = useEducationForms()
  const educationFormOptions = useMemo(
    () => educationForms.map((f) => ({ code: f.code, name: classifierLabel(f, i18n.language) })),
    [educationForms, i18n.language],
  )

  const open = !!row
  // Fixed on an existing row — the speciality search is scoped to this education type.
  const educationType = (row?.educationType as EducationTypeCode) || '11'

  const [specialityId, setSpecialityId] = useState('')
  const [specialityLabel, setSpecialityLabel] = useState('')
  const [educationForm, setEducationForm] = useState('11')
  const [eduYear, setEduYear] = useState('')
  const [status, setStatus] = useState('ACTIVE')

  // Pre-fill from the row each time it opens (or changes).
  useEffect(() => {
    if (!row) return
    setSpecialityId(row.specialityId)
    setSpecialityLabel(
      `${row.specialityCode ? `${row.specialityCode} · ` : ''}${row.specialityName ?? ''}`,
    )
    setEducationForm(row.educationForm || '11')
    setEduYear(row.eduYear ? String(row.eduYear) : '')
    // Any non-ACTIVE status collapses to the "Nofaol" (SUSPENDED) toggle option.
    setStatus(row.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED')
  }, [row])

  // Speciality picker — server-side search, only queried while the popover is open.
  const [pickerOpen, setPickerOpen] = useState(false)
  const [specQuery, setSpecQuery] = useState('')
  const debouncedQuery = useDebounce(specQuery, 300)
  const yearNum = Number(eduYear)
  const hasQuery = debouncedQuery.trim().length > 0
  const { data: specData, isFetching: specLoading } = useSpecialityList(
    {
      educationType,
      year: Number.isFinite(yearNum) ? yearNum : undefined,
      q: debouncedQuery,
      size: 50,
    },
    open && pickerOpen && !!eduYear && hasQuery,
  )
  const specResults = specData?.content ?? []

  const { data: yearsRaw } = useSpecialityYears()
  const years = useMemo(() => [...(yearsRaw ?? [])].sort((a, b) => b - a), [yearsRaw])
  const yearOptions = useMemo(
    () => years.map((y) => ({ code: String(y), name: `${y}-${y + 1}` })),
    [years],
  )

  const canSubmit =
    !!eduYear && Number.isFinite(yearNum) && !!specialityId && !!educationForm && !!status

  const submit = () => {
    if (!row) return
    updateMutation.mutate(
      { id: row.id, payload: { specialityId, educationForm, eduYear: yearNum, status } },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  const selectSpeciality = (r: SpecialityRow) => {
    setSpecialityId(r.id)
    setSpecialityLabel(`${r.code ? `${r.code} · ` : ''}${r.nameUz}`)
    setPickerOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Edit')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* University — READ-ONLY (fixed on an existing row) */}
          <div className="space-y-1.5">
            <Label>{t('University')}</Label>
            <Input value={row?.universityName || row?.universityCode || ''} disabled readOnly />
          </div>

          {/* Education type — READ-ONLY (fixed; scopes the speciality search) */}
          <div className="space-y-1.5">
            <Label>{t('Education type')}</Label>
            <Input value={row?.educationTypeName || row?.educationType || ''} disabled readOnly />
          </div>

          {/* Education year — editable (searchable) */}
          <div className="space-y-1.5">
            <Label>
              {t('Education year')} <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              className="w-full"
              value={eduYear || ALL_VALUE}
              onChange={(v) => setEduYear(v === ALL_VALUE ? '' : v)}
              options={yearOptions}
              placeholder={t('Education year')}
              allLabel={t('Education year')}
              searchPlaceholder={t('Search')}
              emptyLabel={t('No data found')}
            />
          </div>

          {/* Speciality — editable (server-side search within the fixed type + selected year) */}
          <div className="space-y-1.5">
            <Label>
              {t('Speciality')} <span className="text-red-500">*</span>
            </Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={!eduYear}
                  className="flex w-full items-center justify-between gap-2 rounded-md border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--hover-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span
                    className={
                      specialityLabel ? 'truncate' : 'truncate text-[var(--text-secondary)]'
                    }
                  >
                    {specialityLabel || t('Select speciality')}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="relative border-b border-[var(--border-color-pro)] p-2">
                  <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <Input
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    value={specQuery}
                    onChange={(e) => setSpecQuery(e.target.value)}
                    placeholder={t('Search by code or name')}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-64">
                  {!hasQuery ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--text-secondary)]">
                      <Search className="h-4 w-4" /> {t('Search by code or name')}
                    </div>
                  ) : specLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-[var(--text-secondary)]">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('Loading...')}
                    </div>
                  ) : specResults.length === 0 ? (
                    <div className="py-6 text-center text-sm text-[var(--text-secondary)]">
                      {t('No data found')}
                    </div>
                  ) : (
                    <div className="p-1">
                      {specResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => selectSpeciality(r)}
                          className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--hover-bg)]"
                        >
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              specialityId === r.id ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          <span className="flex min-w-0 flex-col">
                            <span>
                              {r.code ? (
                                <span className="text-[var(--text-secondary)] tabular-nums">
                                  {r.code} ·{' '}
                                </span>
                              ) : null}
                              {r.nameUz}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                              {specialityLevelKey(r.hierarchyLevel) ? (
                                <span className="font-medium text-[var(--primary)]">
                                  {t(specialityLevelKey(r.hierarchyLevel) as string)}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {specResults.length >= 50 && (
                  <div className="border-t border-[var(--border-color-pro)] px-3 py-1.5 text-center text-xs text-[var(--text-secondary)]">
                    {t('Refine your search to see more')}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Education form — editable */}
          <div className="space-y-1.5">
            <Label>
              {t('Education form')} <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              className="w-full"
              value={educationForm || ALL_VALUE}
              onChange={(v) => setEducationForm(v === ALL_VALUE ? '' : v)}
              options={educationFormOptions}
              placeholder={t('Education form')}
              allLabel={t('Education form')}
              searchPlaceholder={t('Search')}
              emptyLabel={t('No data found')}
            />
          </div>

          {/* Status (Faol / Nofaol) — editable */}
          <div className="space-y-1.5">
            <Label>
              {t('Status')} <span className="text-red-500">*</span>
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {t(s.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={submit} disabled={!canSubmit || updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
