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
import { MultiSelect } from '@/components/filters/MultiSelect'
import { useDebounce } from '@/hooks/useDebounce'
import { useUniversities } from '@/hooks/useUniversities'
import { useSpecialityList, useSpecialityYears } from '@/hooks/useSpeciality'
import {
  useBulkCreateSpecialityAttachments,
  useEducationForms,
  useEducationTypes,
} from '@/hooks/useSpecialityAttachments'
import { specialityLevelKey } from '@/pages/classifiers/speciality/speciality-tree.util'
import type { EducationTypeCode, SpecialityRow } from '@/api/speciality.api'
import { classifierLabel } from '@/api/specialityAttachments.api'

// Education type + education form are NOT hard-coded — both come from their modern classifiers
// (h_education_type / h_education_form) via useEducationTypes / useEducationForms.
// Faol/Nofaol toggle → the entity status. ACTIVE = Faol, SUSPENDED = Nofaol.
const STATUSES: { code: string; labelKey: string }[] = [
  { code: 'ACTIVE', labelKey: 'Active' },
  { code: 'SUSPENDED', labelKey: 'Inactive' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Assign (attach) a unified-classifier speciality to an OTM. The speciality is picked with a
 * server-side search (~2779 nodes) narrowed by education type; the university list is the FULL
 * registry (not just OTMs that already have attachments). On success the parent list refetches.
 */
export function SpecialityAttachmentCreateDialog({ open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation()
  const bulkMutation = useBulkCreateSpecialityAttachments()
  const { data: educationForms = [] } = useEducationForms()
  const educationFormOptions = useMemo(
    () => educationForms.map((f) => ({ code: f.code, name: classifierLabel(f, i18n.language) })),
    [educationForms, i18n.language],
  )
  const { data: educationTypes = [] } = useEducationTypes()
  const educationTypeOptions = useMemo(
    () => educationTypes.map((tp) => ({ code: tp.code, name: classifierLabel(tp, i18n.language) })),
    [educationTypes, i18n.language],
  )

  const [universityCode, setUniversityCode] = useState('')
  const [educationType, setEducationType] = useState<string>('11')
  const [specialityId, setSpecialityId] = useState('')
  const [specialityLabel, setSpecialityLabel] = useState('')
  // Multi-select: one attachment row is created per ticked education form. Defaults to Kunduzgi (11).
  const [selectedForms, setSelectedForms] = useState<string[]>(['11'])
  const [eduYear, setEduYear] = useState('')
  const [status, setStatus] = useState('ACTIVE')

  // Speciality picker — server-side search, only queried while the popover is open.
  const [pickerOpen, setPickerOpen] = useState(false)
  const [specQuery, setSpecQuery] = useState('')
  const debouncedQuery = useDebounce(specQuery, 300)
  const yearNum = Number(eduYear)
  const hasQuery = debouncedQuery.trim().length > 0
  // Speciality search is scoped to the education type ONLY — NOT the academic year. A speciality is
  // offered independently of the attachment's year (the year is saved on the row, it does not filter
  // the picker). Idle until the user types a code or name (server-side search), then returns ≤50.
  // APPROVED-only: a NEEDS_REVIEW row has not been distributed to the OTMs yet, so it cannot be
  // attached — the backend refuses it with 422 SPECIALITY_NOT_APPROVED anyway.
  const { data: specData, isFetching: specLoading } = useSpecialityList(
    {
      educationType: educationType as EducationTypeCode,
      reviewStatus: 'APPROVED',
      q: debouncedQuery,
      size: 50,
    },
    open && pickerOpen && !!educationType && hasQuery,
  )
  const specResults = specData?.content ?? []

  // Full university registry (not filterOptions — a fresh OTM may have zero attachments yet).
  const { data: uniData } = useUniversities(
    { page: 0, size: 1000, sort: 'name,asc' },
    { enabled: open },
  )
  const universityOptions = useMemo(
    () => (uniData?.content ?? []).map((u) => ({ code: u.code, name: u.name })),
    [uniData?.content],
  )

  // Academic years present in OUR classifier (newest first). The year is stored on the attachment
  // but does NOT scope the speciality search (specialities are year-independent here).
  const { data: yearsRaw } = useSpecialityYears()
  const years = useMemo(() => [...(yearsRaw ?? [])].sort((a, b) => b - a), [yearsRaw])
  const yearOptions = useMemo(
    // Show the academic-year span in parentheses next to the start year: "2026 (2026-2027)".
    () => years.map((y) => ({ code: String(y), name: `(${y}-${y + 1})` })),
    [years],
  )
  // Default to the newest year; re-default when the education type (→ its year set) changes.
  useEffect(() => {
    if (years.length && !years.includes(Number(eduYear))) {
      setEduYear(String(years[0]))
    }
  }, [years, eduYear])

  const reset = () => {
    setUniversityCode('')
    setEducationType('11')
    setSpecialityId('')
    setSpecialityLabel('')
    setSelectedForms(['11'])
    setEduYear('')
    setStatus('ACTIVE')
    setSpecQuery('')
    setPickerOpen(false)
  }

  const handleClose = (o: boolean) => {
    if (!o) reset()
    onOpenChange(o)
  }

  const canSubmit =
    !!universityCode &&
    !!educationType &&
    !!eduYear &&
    Number.isFinite(yearNum) &&
    !!specialityId &&
    selectedForms.length > 0

  const submit = () => {
    bulkMutation.mutate(
      { universityCode, specialityId, educationForms: selectedForms, eduYear: yearNum, status },
      { onSuccess: () => handleClose(false) },
    )
  }

  // Education forms as generic {value,label} options for the multi-select.
  const educationFormMultiOptions = useMemo(
    () => educationFormOptions.map((f) => ({ value: f.code, label: f.name })),
    [educationFormOptions],
  )

  const selectSpeciality = (row: SpecialityRow) => {
    setSpecialityId(row.id)
    setSpecialityLabel(`${row.code ? `${row.code} · ` : ''}${row.nameUz}`)
    setPickerOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Attach')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* University (searchable by code OR name) */}
          <div className="space-y-1.5">
            <Label>
              {t('University')} <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              className="w-full"
              value={universityCode || ALL_VALUE}
              onChange={(v) => setUniversityCode(v === ALL_VALUE ? '' : v)}
              options={universityOptions}
              placeholder={t('Select university')}
              allLabel={t('Select university')}
              searchPlaceholder={t('Search')}
              emptyLabel={t('No data found')}
            />
          </div>

          {/* Education type FIRST (before the year) — searchable, all classifier types (h_education_type) */}
          <div className="space-y-1.5">
            <Label>
              {t('Education type')} <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              className="w-full"
              value={educationType || ALL_VALUE}
              onChange={(v) => {
                setEducationType(v === ALL_VALUE ? '' : v)
                setSpecialityId('')
                setSpecialityLabel('')
                setSpecQuery('')
              }}
              options={educationTypeOptions}
              placeholder={t('Education type')}
              allLabel={t('Education type')}
              searchPlaceholder={t('Search')}
              emptyLabel={t('No data found')}
            />
          </div>

          {/* Academic year — saved on the attachment row; does NOT filter the speciality picker
              (specialities are offered independently of the year), so changing it keeps the pick. */}
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

          {/* Speciality picker (server-side search) */}
          <div className="space-y-1.5">
            <Label>
              {t('Speciality')} <span className="text-red-500">*</span>
            </Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={!educationType}
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
                      {specResults.map((row) => (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => selectSpeciality(row)}
                          className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--hover-bg)]"
                        >
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              specialityId === row.id ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          <span className="flex min-w-0 flex-col">
                            <span>
                              {row.code ? (
                                <span className="text-[var(--text-secondary)] tabular-nums">
                                  {row.code} ·{' '}
                                </span>
                              ) : null}
                              {row.nameUz}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                              {specialityLevelKey(row.hierarchyLevel) ? (
                                <span className="font-medium text-[var(--primary)]">
                                  {t(specialityLevelKey(row.hierarchyLevel) as string)}
                                </span>
                              ) : null}
                              {specialityLevelKey(row.hierarchyLevel) && row.years?.length
                                ? ' · '
                                : ''}
                              {row.years?.length ? (
                                // The speciality's own validity years (h_speciality_year) — NOT the
                                // attachment's academic year picked above. Both used to read
                                // "O'quv yili", which made the row look like it contradicted the
                                // year field two controls up.
                                <span className="tabular-nums">
                                  {t('Speciality years')}:{' '}
                                  {[...row.years].sort((a, b) => a - b).join(', ')}
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

          {/* Education form — MULTI-select: tick every form; one attachment row is created per form. */}
          <div className="space-y-1.5">
            <Label>
              {t('Education form')} <span className="text-red-500">*</span>
            </Label>
            {/* Multi-select (same look as the classifier's Yillar picker): tick every form —
                one attachment row is created per form on submit. */}
            <MultiSelect
              options={educationFormMultiOptions}
              selected={selectedForms}
              onChange={setSelectedForms}
              placeholder={t('Education form')}
              searchPlaceholder={t('Search')}
              searchable={false}
            />
          </div>

          {/* Status (Faol / Nofaol) — a new attachment defaults to Faol (ACTIVE) */}
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
          <Button variant="outline" onClick={() => handleClose(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={submit} disabled={!canSubmit || bulkMutation.isPending}>
            {bulkMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {t('Attach')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
