/**
 * Ministry Ratings API Client
 *
 * A "rating" is a ranked-by-university report: the backend ranks every OTM by a
 * simple COUNT/AVG metric and returns the SAME ReportDto contract the analytics
 * reports use (KPI cards + a pre-sorted 'table' block with a Rank ordinal + a
 * top-15 'bar' block). The frontend renders it through the shared ReportView.
 *
 * Endpoint: GET /api/v1/web/ratings/{administrative|academic|scientific|gpa}
 * Response:  ResponseWrapper<ReportDto>  (data extracted here)
 */

import apiClient from './client'
import type { ReportBaseParams, ReportDto } from './reports.api'

// Ratings share the exact ReportDto contract with reports — re-export the type
// so consumers can import it from either module.
export type { ReportDto } from './reports.api'

// ---------------------------------------------------------------------------
// Request params (all ratings accept the common report filters)
// ---------------------------------------------------------------------------

export type AdministrativeRatingParams = ReportBaseParams
export type AcademicRatingParams = ReportBaseParams
export type ScientificRatingParams = ReportBaseParams
export type GpaRatingParams = ReportBaseParams

// ---------------------------------------------------------------------------
// Response envelope (backend wraps payload in ResponseWrapper<T>)
// ---------------------------------------------------------------------------

interface ResponseWrapper<T> {
  data: T
}

async function fetchRating<P extends ReportBaseParams>(
  path: string,
  params: P,
  signal?: AbortSignal,
): Promise<ReportDto> {
  const response = await apiClient.get<ResponseWrapper<ReportDto>>(`/api/v1/web/ratings/${path}`, {
    params,
    signal,
  })
  return response.data.data
}

export const getAdministrativeRating = (
  params: AdministrativeRatingParams = {},
  signal?: AbortSignal,
) => fetchRating('administrative', params, signal)

export const getAcademicRating = (params: AcademicRatingParams = {}, signal?: AbortSignal) =>
  fetchRating('academic', params, signal)

export const getScientificRating = (params: ScientificRatingParams = {}, signal?: AbortSignal) =>
  fetchRating('scientific', params, signal)

export const getGpaRating = (params: GpaRatingParams = {}, signal?: AbortSignal) =>
  fetchRating('gpa', params, signal)

export const ratingsApi = {
  administrative: getAdministrativeRating,
  academic: getAcademicRating,
  scientific: getScientificRating,
  gpa: getGpaRating,
}
