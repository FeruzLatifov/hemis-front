/**
 * Analytics Reports API Client
 *
 * Ministry analytics reports share ONE response contract (ReportDto) across
 * all report types. The backend returns stable English i18n keys for every
 * label/title/column so the frontend simply t()'s them.
 *
 * Endpoint: GET /api/v1/web/reports/{students|institutions|scientific|teachers}
 * Response:  ResponseWrapper<ReportDto>  (data extracted here)
 */

import apiClient from './client'

// ---------------------------------------------------------------------------
// Shared response contract (field names EXACT — mirror backend ReportDto)
// ---------------------------------------------------------------------------

export type ReportVizType = 'bar' | 'pie' | 'table'

export interface ReportCategory {
  readonly label: string
  readonly value: number
}

export interface ReportColumn {
  /** Column key used to read values out of each row. */
  readonly key: string
  /** English i18n key rendered via t(). */
  readonly label: string
}

/** A row is a map of columnKey -> value. First column is the text label. */
export type ReportRow = Record<string, string | number>

export interface ReportBlock {
  readonly key: string
  /** English i18n key rendered via t(). */
  readonly title: string
  readonly viz: ReportVizType
  /** Populated for viz 'bar' | 'pie' (else empty/null). */
  readonly categories?: ReportCategory[] | null
  /** Populated for viz 'table' (else empty/null). */
  readonly columns?: ReportColumn[] | null
  /** Populated for viz 'table'. */
  readonly rows?: ReportRow[] | null
}

export interface ReportKpi {
  readonly key: string
  /** English i18n key rendered via t(). */
  readonly label: string
  readonly value: number
}

export interface ReportDto {
  readonly kpis: ReportKpi[]
  readonly blocks: ReportBlock[]
}

// ---------------------------------------------------------------------------
// Request params
// ---------------------------------------------------------------------------

/** Params common to every report. */
export interface ReportBaseParams {
  /** Academic year; backend defaults to current when omitted. */
  educationYear?: number
  /** Optional single-university drill-down. */
  universityCode?: string
}

export interface StudentsReportParams extends ReportBaseParams {
  educationType?: string
}

export type InstitutionsReportParams = ReportBaseParams

export type ScientificReportParams = ReportBaseParams

export interface TeachersReportParams extends ReportBaseParams {
  academicDegree?: string
}

export interface AcademicReportParams extends ReportBaseParams {
  educationType?: string
}

export type EconomicReportParams = ReportBaseParams

// ---------------------------------------------------------------------------
// Response envelope (backend wraps payload in ResponseWrapper<T>)
// ---------------------------------------------------------------------------

interface ResponseWrapper<T> {
  data: T
}

async function fetchReport<P extends ReportBaseParams>(
  path: string,
  params: P,
  signal?: AbortSignal,
): Promise<ReportDto> {
  const response = await apiClient.get<ResponseWrapper<ReportDto>>(`/api/v1/web/reports/${path}`, {
    params,
    signal,
  })
  return response.data.data
}

export const getStudentsReport = (params: StudentsReportParams = {}, signal?: AbortSignal) =>
  fetchReport('students', params, signal)

export const getInstitutionsReport = (
  params: InstitutionsReportParams = {},
  signal?: AbortSignal,
) => fetchReport('institutions', params, signal)

export const getScientificReport = (params: ScientificReportParams = {}, signal?: AbortSignal) =>
  fetchReport('scientific', params, signal)

export const getTeachersReport = (params: TeachersReportParams = {}, signal?: AbortSignal) =>
  fetchReport('teachers', params, signal)

export const getAcademicReport = (params: AcademicReportParams = {}, signal?: AbortSignal) =>
  fetchReport('academic', params, signal)

export const getEconomicReport = (params: EconomicReportParams = {}, signal?: AbortSignal) =>
  fetchReport('economic', params, signal)

export const reportsApi = {
  students: getStudentsReport,
  institutions: getInstitutionsReport,
  scientific: getScientificReport,
  teachers: getTeachersReport,
  academic: getAcademicReport,
  economic: getEconomicReport,
}
