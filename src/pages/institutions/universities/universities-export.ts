import {
  type UniversityRow,
  type UniversitiesParams,
  type Dictionaries,
  universitiesApi,
} from '@/api/universities.api'
import { type TFunction } from 'i18next'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/utils/error.util'

// ─── Build filter params (shared between queryParams and export) ──
export function buildFilterParams(filters: {
  debouncedSearch: string
  searchScope: string
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
}): Omit<UniversitiesParams, 'page' | 'size' | 'sort'> {
  const params: Omit<UniversitiesParams, 'page' | 'size' | 'sort'> = {}
  if (filters.debouncedSearch) {
    params.q = filters.debouncedSearch
    if (filters.searchScope && filters.searchScope !== 'all')
      params.searchField = filters.searchScope
  }
  if (filters.regionId) params.regionId = filters.regionId
  if (filters.ownershipId) params.ownershipId = filters.ownershipId
  if (filters.typeId) params.typeId = filters.typeId
  if (filters.activityStatusId) params.activityStatusId = filters.activityStatusId
  if (filters.belongsToId) params.belongsToId = filters.belongsToId
  if (filters.contractCategoryId) params.contractCategoryId = filters.contractCategoryId
  if (filters.versionTypeId) params.versionTypeId = filters.versionTypeId
  if (filters.districtId) params.districtId = filters.districtId
  if (filters.activeFilter) params.active = filters.activeFilter
  if (filters.gpaEditFilter) params.gpaEdit = filters.gpaEditFilter
  if (filters.accreditationEditFilter) params.accreditationEdit = filters.accreditationEditFilter
  if (filters.addStudentFilter) params.addStudent = filters.addStudentFilter
  if (filters.allowGroupingFilter) params.allowGrouping = filters.allowGroupingFilter
  if (filters.allowTransferOutsideFilter)
    params.allowTransferOutside = filters.allowTransferOutsideFilter

  return params
}

// ─── Export rows to XLSX ──────────────────────────────────────────
export async function exportToXlsx(
  rows: UniversityRow[],
  dictionaries: Dictionaries,
  t: TFunction,
): Promise<void> {
  const XLSX = await import('xlsx')

  const resolveName = (code: string | undefined, list: { code: string; name: string }[]) =>
    list.find((item) => item.code === code)?.name ?? code ?? ''

  const boolLabel = (val?: boolean) => (val ? t('Yes') : val === false ? t('No') : '')

  const wsData = rows.map((row, idx) => ({
    '#': idx + 1,
    [t('Code')]: row.code,
    [t('Name')]: row.name,
    [t('INN')]: row.tin || '',
    [t('Region')]: resolveName(row.regionCode, dictionaries.regions),
    [t('Ownership')]: resolveName(row.ownershipCode, dictionaries.ownerships),
    [t('Type')]: resolveName(row.universityTypeCode, dictionaries.types),
    [t('Activity status')]: resolveName(row.activityStatusCode, dictionaries.activityStatuses),
    [t('Belongs to')]: resolveName(row.belongsToCode, dictionaries.belongsToOptions),
    [t('Contract category')]: resolveName(
      row.contractCategoryCode,
      dictionaries.contractCategories,
    ),
    [t('HEMIS version')]: resolveName(row.versionTypeCode, dictionaries.versionTypes),
    [t('Status')]: row.active ? t('Active') : t('Inactive'),
    [t('District')]:
      resolveName(row.soatoRegion, dictionaries.districts) ||
      resolveName(row.soatoRegion, dictionaries.regions),
    [t('Address')]: row.address || '',
    [t('Mail address')]: row.mailAddress || '',
    [t('Cadastre')]: row.cadastre || '',
    [t('University URL')]: row.universityUrl || '',
    [t('Student URL')]: row.studentUrl || '',
    [t('Teacher URL')]: row.teacherUrl || '',
    [t('UZBMB URL')]: row.uzbmbUrl || '',
    [t('GPA edit')]: boolLabel(row.gpaEdit),
    [t('Accreditation edit')]: boolLabel(row.accreditationEdit),
    [t('Add student')]: boolLabel(row.addStudent),
    [t('Allow grouping')]: boolLabel(row.allowGrouping),
    [t('Allow transfer outside')]: boolLabel(row.allowTransferOutside),
    [t('Bank info')]: row.bankInfo || '',
    [t('Accreditation info')]: row.accreditationInfo || '',
  }))

  const ws = XLSX.utils.json_to_sheet(wsData)

  // Auto-fit column widths
  if (wsData.length > 0) {
    ws['!cols'] = Object.keys(wsData[0]).map((key) => ({
      wch:
        Math.max(key.length, ...wsData.map((r) => String(r[key as keyof typeof r] || '').length)) +
        2,
    }))
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, t('Universities'))
  XLSX.writeFile(wb, `universities_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// ─── Export all universities with current filters ─────────────────
export async function handleExportAll(
  filterParams: Omit<UniversitiesParams, 'page' | 'size' | 'sort'>,
  dictionaries: Dictionaries,
  t: TFunction,
): Promise<void> {
  try {
    const rows = await universitiesApi.exportUniversities(filterParams)
    await exportToXlsx(rows, dictionaries, t)
    toast.success(t('Excel file downloading...'))
  } catch (error) {
    toast.error(extractApiErrorMessage(error, t('Export failed')))
  }
}

// ─── Export selected rows ─────────────────────────────────────────
export async function handleExportSelected(
  selectedRows: UniversityRow[],
  dictionaries: Dictionaries,
  t: TFunction,
): Promise<void> {
  try {
    if (selectedRows.length === 0) return
    await exportToXlsx(selectedRows, dictionaries, t)
    toast.success(t('Excel file downloading...'))
  } catch (error) {
    toast.error(extractApiErrorMessage(error, t('Export failed')))
  }
}
