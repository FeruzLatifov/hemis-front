import { useMemo } from 'react'
import { X } from 'lucide-react'
import { CustomTagFilter } from '@/components/filters/CustomTagFilter'
import { type StudentDictionaries } from '@/api/students.api'
import { type TFunction } from 'i18next'

// ─── Filter configuration type ────────────────────────────────────
interface FilterConfig {
  key: string
  label: string
  data: { code: string; name: string }[]
  singleSelect?: boolean
}

// ─── Filter values type (all URL-driven filter strings) ───────────
export interface StudentsFilterValues {
  studentStatus: string
  paymentForm: string
  educationType: string
  educationForm: string
  course: string
  gender: string
}

// ─── All URL param keys for student filters ───────────────────────
export const STUDENT_FILTER_KEYS = [
  'studentStatus',
  'paymentForm',
  'educationType',
  'educationForm',
  'course',
  'gender',
] as const

// ─── Props ────────────────────────────────────────────────────────
interface StudentsFiltersProps {
  filterValues: StudentsFilterValues
  onFilterChange: (key: string, values: string[]) => void
  onClearFilters: () => void
  showPanel: boolean
  hasActiveFilters: boolean
  dictionaries: StudentDictionaries
  t: TFunction
}

// ─── Component ────────────────────────────────────────────────────
export function StudentsFilters({
  filterValues,
  onFilterChange,
  onClearFilters,
  showPanel,
  hasActiveFilters,
  dictionaries,
  t,
}: StudentsFiltersProps) {
  // Build filter configs data-driven
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      { key: 'studentStatus', label: t('Status'), data: dictionaries.studentStatuses },
      { key: 'paymentForm', label: t('Payment form'), data: dictionaries.paymentForms },
      { key: 'educationType', label: t('Education type'), data: dictionaries.educationTypes },
      { key: 'educationForm', label: t('Education form'), data: dictionaries.educationForms },
      { key: 'course', label: t('Course'), data: dictionaries.courses },
      { key: 'gender', label: t('Gender'), data: dictionaries.genders },
    ],
    [t, dictionaries],
  )

  // Helper to get value array from filter values
  const getFilterValue = (key: string): string[] => {
    const raw = filterValues[key as keyof StudentsFilterValues]
    if (!raw) return []
    return raw.split(',')
  }

  // Resolve display name for a chip value
  const resolveChipDisplayName = (key: string, value: string): string => {
    const config = filterConfigs.find((fc) => fc.key === key)
    if (!config) return value
    return value
      .split(',')
      .map((code) => config.data.find((item) => item.code === code)?.name || code)
      .join(', ')
  }

  // Collect active filters for chips display
  const activeFilters = useMemo(() => {
    return filterConfigs
      .filter((fc) => {
        const raw = filterValues[fc.key as keyof StudentsFilterValues]
        return !!raw
      })
      .map((fc) => ({
        key: fc.key,
        label: fc.label,
        value: filterValues[fc.key as keyof StudentsFilterValues],
      }))
  }, [filterConfigs, filterValues])

  return (
    <>
      {/* ──── Filters Panel (smooth CSS Grid collapse) ──── */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          showPanel ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-b border-[var(--border-color-pro)] bg-[var(--table-row-alt)] px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {filterConfigs.map((fc) => (
                <CustomTagFilter
                  key={fc.key}
                  label={fc.label}
                  data={fc.data}
                  value={getFilterValue(fc.key)}
                  onChange={(codes) => onFilterChange(fc.key, codes)}
                  singleSelect={fc.singleSelect}
                />
              ))}

              {/* Clear all filters */}
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                  {t('Clear')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ──── Active filter chips (visible when panel is closed) ──── */}
      {!showPanel && hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border-color-pro)] px-4 py-2">
          {activeFilters.map((af) => (
            <span
              key={af.key}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--active-bg)] px-2 py-0.5 text-xs text-[var(--primary)]"
            >
              <span className="text-[var(--text-secondary)]">{af.label}:</span>
              <span className="font-medium">{resolveChipDisplayName(af.key, af.value)}</span>
              <button
                onClick={() => onFilterChange(af.key, [])}
                className="ml-0.5 rounded-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={onClearFilters}
            className="text-xs text-[var(--text-secondary)] transition-colors hover:text-red-500"
          >
            {t('Clear')}
          </button>
        </div>
      )}
    </>
  )
}
