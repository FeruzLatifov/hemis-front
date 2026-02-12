import { useMemo } from 'react'
import { X } from 'lucide-react'
import { CustomTagFilter } from '@/components/filters/CustomTagFilter'
import { type Dictionaries } from '@/api/universities.api'
import { type TFunction } from 'i18next'

// ─── Filter configuration type ────────────────────────────────────
interface FilterConfig {
  key: string
  label: string
  data: { code: string; name: string }[]
  singleSelect?: boolean
}

// ─── Filter values type (all URL-driven filter strings) ───────────
export interface UniversitiesFilterValues {
  regionId: string
  ownershipId: string
  typeId: string
  activityStatusId: string
  belongsToId: string
  contractCategoryId: string
  versionTypeId: string
  districtId: string
  activeFilter: string
  gpaEditFilter: string
  accreditationEditFilter: string
  addStudentFilter: string
  allowGroupingFilter: string
  allowTransferOutsideFilter: string
}

// ─── Mapping from filter key to URL param key ─────────────────────
const FILTER_KEY_TO_URL_PARAM: Record<string, string> = {
  regionId: 'regionId',
  ownershipId: 'ownershipId',
  typeId: 'typeId',
  activityStatusId: 'activityStatusId',
  belongsToId: 'belongsToId',
  contractCategoryId: 'contractCategoryId',
  versionTypeId: 'versionTypeId',
  districtId: 'districtId',
  activeFilter: 'active',
  gpaEditFilter: 'gpaEdit',
  accreditationEditFilter: 'accreditationEdit',
  addStudentFilter: 'addStudent',
  allowGroupingFilter: 'allowGrouping',
  allowTransferOutsideFilter: 'allowTransferOutside',
}

// ─── Mapping from filter key to dictionary lookup key ─────────────
const FILTER_KEY_TO_DICT_KEY: Record<string, keyof Dictionaries | null> = {
  regionId: 'regions',
  ownershipId: 'ownerships',
  typeId: 'types',
  activityStatusId: 'activityStatuses',
  belongsToId: 'belongsToOptions',
  contractCategoryId: 'contractCategories',
  versionTypeId: 'versionTypes',
  districtId: 'districts',
  activeFilter: null,
  gpaEditFilter: null,
  accreditationEditFilter: null,
  addStudentFilter: null,
  allowGroupingFilter: null,
  allowTransferOutsideFilter: null,
}

// ─── Props ────────────────────────────────────────────────────────
interface UniversitiesFiltersProps {
  filterValues: UniversitiesFilterValues
  onFilterChange: (key: string, values: string[]) => void
  onClearFilters: () => void
  showPanel: boolean
  hasActiveFilters: boolean
  dictionaries: Dictionaries
  t: TFunction
}

// ─── Component ────────────────────────────────────────────────────
export function UniversitiesFilters({
  filterValues,
  onFilterChange,
  onClearFilters,
  showPanel,
  hasActiveFilters,
  dictionaries,
  t,
}: UniversitiesFiltersProps) {
  const booleanData = useMemo(
    () => [
      { code: 'true', name: t('Yes') },
      { code: 'false', name: t('No') },
    ],
    [t],
  )

  const statusData = useMemo(
    () => [
      { code: 'true', name: t('Active') },
      { code: 'false', name: t('Inactive') },
    ],
    [t],
  )

  // Build filter configs data-driven
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      { key: 'regionId', label: t('Region'), data: dictionaries.regions },
      { key: 'ownershipId', label: t('Ownership'), data: dictionaries.ownerships },
      { key: 'typeId', label: t('Type'), data: dictionaries.types },
      { key: 'activityStatusId', label: t('Activity status'), data: dictionaries.activityStatuses },
      { key: 'belongsToId', label: t('Belongs to'), data: dictionaries.belongsToOptions },
      {
        key: 'contractCategoryId',
        label: t('Contract category'),
        data: dictionaries.contractCategories,
      },
      { key: 'versionTypeId', label: t('HEMIS version'), data: dictionaries.versionTypes },
      { key: 'districtId', label: t('District'), data: dictionaries.districts },
      { key: 'activeFilter', label: t('Status'), data: statusData, singleSelect: true },
      { key: 'gpaEditFilter', label: t('GPA edit'), data: booleanData, singleSelect: true },
      {
        key: 'accreditationEditFilter',
        label: t('Accreditation edit'),
        data: booleanData,
        singleSelect: true,
      },
      {
        key: 'addStudentFilter',
        label: t('Add student'),
        data: booleanData,
        singleSelect: true,
      },
      {
        key: 'allowGroupingFilter',
        label: t('Allow grouping'),
        data: booleanData,
        singleSelect: true,
      },
      {
        key: 'allowTransferOutsideFilter',
        label: t('Allow transfer outside'),
        data: booleanData,
        singleSelect: true,
      },
    ],
    [t, dictionaries, booleanData, statusData],
  )

  // Helper to get value array from filter values
  const getFilterValue = (key: string): string[] => {
    const raw = filterValues[key as keyof UniversitiesFilterValues]
    if (!raw) return []
    const config = filterConfigs.find((fc) => fc.key === key)
    if (config?.singleSelect) return [raw]
    return raw.split(',')
  }

  // Helper to get the URL param key for a filter key
  const getUrlParam = (key: string): string => {
    return FILTER_KEY_TO_URL_PARAM[key] ?? key
  }

  // Resolve display name for a chip value
  const resolveChipDisplayName = (key: string, value: string): string => {
    const dictKey = FILTER_KEY_TO_DICT_KEY[key]
    if (dictKey) {
      const dict = dictionaries[dictKey]
      return value
        .split(',')
        .map((code) => dict.find((item) => item.code === code)?.name || code)
        .join(', ')
    }
    // Boolean/status filters
    if (key === 'activeFilter') {
      return value === 'true' ? t('Active') : t('Inactive')
    }
    return value === 'true' ? t('Yes') : t('No')
  }

  // Collect active filters for chips display
  const activeFilters = useMemo(() => {
    return filterConfigs
      .filter((fc) => {
        const raw = filterValues[fc.key as keyof UniversitiesFilterValues]
        return !!raw
      })
      .map((fc) => ({
        key: fc.key,
        label: fc.label,
        value: filterValues[fc.key as keyof UniversitiesFilterValues],
        urlParam: getUrlParam(fc.key),
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
          <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {filterConfigs.map((fc) => (
                <CustomTagFilter
                  key={fc.key}
                  label={fc.label}
                  data={fc.data}
                  value={getFilterValue(fc.key)}
                  onChange={(codes) => onFilterChange(getUrlParam(fc.key), codes)}
                  singleSelect={fc.singleSelect}
                />
              ))}

              {/* Clear all filters */}
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:text-red-500"
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
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 px-4 py-2">
          {activeFilters.map((af) => (
            <span
              key={af.key}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--active-bg)] px-2 py-0.5 text-xs text-[var(--primary)]"
            >
              <span className="text-[var(--text-secondary)]">{af.label}:</span>
              <span className="font-medium">{resolveChipDisplayName(af.key, af.value)}</span>
              <button
                onClick={() => onFilterChange(af.urlParam, [])}
                className="ml-0.5 rounded-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={onClearFilters}
            className="text-xs text-gray-400 transition-colors hover:text-red-500"
          >
            {t('Clear')}
          </button>
        </div>
      )}
    </>
  )
}
