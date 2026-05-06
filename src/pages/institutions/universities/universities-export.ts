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
  oneIdFilter: string
  gradingSystemFilter: string
  addForeignStudentFilter: string
  addTransferStudentFilter: string
  addAcademicMobileStudentFilter: string
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
  if (filters.oneIdFilter) params.oneId = filters.oneIdFilter
  if (filters.gradingSystemFilter) params.gradingSystem = filters.gradingSystemFilter
  if (filters.addForeignStudentFilter) params.addForeignStudent = filters.addForeignStudentFilter
  if (filters.addTransferStudentFilter) params.addTransferStudent = filters.addTransferStudentFilter
  if (filters.addAcademicMobileStudentFilter)
    params.addAcademicMobileStudent = filters.addAcademicMobileStudentFilter

  return params
}

// ─── Helpers: blob download + RFC 4180 CSV escaping ──────────────
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Escape a single CSV field per RFC 4180:
 * - wrap in double-quotes if it contains comma, newline, or double-quote
 * - double any embedded double-quote
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

/**
 * Build a UTF-8 BOM CSV blob from a row of headers and an array of rows.
 * The BOM makes Excel detect UTF-8 automatically; written as a unicode
 * escape so ESLint's no-irregular-whitespace rule stays clean.
 */
function rowsToCsvBlob(headers: string[], rows: string[][]): Blob {
  const bom = '﻿'
  const body = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n')
  return new Blob([bom + body], { type: 'text/csv;charset=utf-8;' })
}

// ─── Build CSV row from a UniversityRow ──────────────────────────
function buildUniversityCsv(
  rows: UniversityRow[],
  dictionaries: Dictionaries,
  t: TFunction,
): { headers: string[]; data: string[][] } {
  const resolveName = (code: string | undefined, list: { code: string; name: string }[]) =>
    list.find((item) => item.code === code)?.name ?? code ?? ''

  const boolLabel = (val?: boolean) => (val ? t('Yes') : val === false ? t('No') : '')

  const headers = [
    '#',
    t('Code'),
    t('Name'),
    t('INN'),
    t('Region'),
    t('Ownership'),
    t('Type'),
    t('Activity status'),
    t('Belongs to'),
    t('Contract category'),
    t('HEMIS version'),
    t('Status'),
    t('District'),
    t('Address'),
    t('Mail address'),
    t('Cadastre'),
    t('University URL'),
    t('Student URL'),
    t('Teacher URL'),
    t('UZBMB URL'),
    t('GPA edit'),
    t('Accreditation edit'),
    t('Add student'),
    t('Allow grouping'),
    t('Allow transfer outside'),
    t('OneID login'),
    t('Grading system'),
    t('Add foreign student'),
    t('Add transfer student'),
    t('Add academic mobile student'),
    t('Bank info'),
    t('Accreditation info'),
  ]

  const data = rows.map((row, idx) => [
    String(idx + 1),
    row.code,
    row.name,
    row.tin || '',
    resolveName(row.regionCode, dictionaries.regions),
    resolveName(row.ownershipCode, dictionaries.ownerships),
    resolveName(row.universityTypeCode, dictionaries.types),
    resolveName(row.activityStatusCode, dictionaries.activityStatuses),
    resolveName(row.belongsToCode, dictionaries.belongsToOptions),
    resolveName(row.contractCategoryCode, dictionaries.contractCategories),
    resolveName(row.versionTypeCode, dictionaries.versionTypes),
    row.active ? t('Active') : t('Inactive'),
    resolveName(row.soatoRegion, dictionaries.districts) ||
      resolveName(row.soatoRegion, dictionaries.regions),
    row.address || '',
    row.mailAddress || '',
    row.cadastre || '',
    row.universityUrl || '',
    row.studentUrl || '',
    row.teacherUrl || '',
    row.uzbmbUrl || '',
    boolLabel(row.gpaEdit),
    boolLabel(row.accreditationEdit),
    boolLabel(row.addStudent),
    boolLabel(row.allowGrouping),
    boolLabel(row.allowTransferOutside),
    boolLabel(row.oneId),
    boolLabel(row.gradingSystem),
    boolLabel(row.addForeignStudent),
    boolLabel(row.addTransferStudent),
    boolLabel(row.addAcademicMobileStudent),
    row.bankInfo || '',
    row.accreditationInfo || '',
  ])

  return { headers, data }
}

const todayStamp = () => new Date().toISOString().slice(0, 10)

// ─── Export all universities with current filters ─────────────────
//
// Server-side: backend produces UTF-8 BOM CSV with all admin-relevant fields,
// keeping the heavy `xlsx` package off the wire and eliminating its known
// HIGH advisories (ReDoS + Prototype Pollution).
export async function handleExportAll(
  filterParams: Omit<UniversitiesParams, 'page' | 'size' | 'sort'>,
  _dictionaries: Dictionaries,
  t: TFunction,
): Promise<void> {
  try {
    const blob = await universitiesApi.exportUniversities(filterParams)
    downloadBlob(blob, `universities_${todayStamp()}.csv`)
    toast.success(t('CSV file downloaded'))
  } catch (error) {
    toast.error(extractApiErrorMessage(error, t('Export failed')))
  }
}

// ─── Export selected rows ─────────────────────────────────────────
//
// Client-side CSV generator (no library, no CVE surface). Used only for the
// "export selected rows" affordance — fewer rows, already in memory.
export async function handleExportSelected(
  selectedRows: UniversityRow[],
  dictionaries: Dictionaries,
  t: TFunction,
): Promise<void> {
  try {
    if (selectedRows.length === 0) return
    const { headers, data } = buildUniversityCsv(selectedRows, dictionaries, t)
    downloadBlob(rowsToCsvBlob(headers, data), `universities_selected_${todayStamp()}.csv`)
    toast.success(t('CSV file downloaded'))
  } catch (error) {
    toast.error(extractApiErrorMessage(error, t('Export failed')))
  }
}
