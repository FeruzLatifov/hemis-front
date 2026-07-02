import { useQuery } from '@tanstack/react-query'
import {
  getStudentsReport,
  getInstitutionsReport,
  getScientificReport,
  getTeachersReport,
  type StudentsReportParams,
  type InstitutionsReportParams,
  type ScientificReportParams,
  type TeachersReportParams,
} from '@/api/reports.api'
import { queryKeys } from '@/lib/queryKeys'
import { CACHE } from '@/constants/cache'

/**
 * Analytics report hooks — one thin useQuery per report, sharing the same
 * ReportDto contract. Backend @Cacheable("reports", 30m) already caches the
 * heavy aggregation, so a MEDIUM staleTime keeps the UI snappy without
 * re-hammering the replica on every filter tweak.
 */

export function useStudentsReport(params: StudentsReportParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports.students(params as Record<string, unknown>),
    queryFn: ({ signal }) => getStudentsReport(params, signal),
    staleTime: CACHE.MEDIUM,
  })
}

export function useInstitutionsReport(params: InstitutionsReportParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports.institutions(params as Record<string, unknown>),
    queryFn: ({ signal }) => getInstitutionsReport(params, signal),
    staleTime: CACHE.MEDIUM,
  })
}

export function useScientificReport(params: ScientificReportParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports.scientific(params as Record<string, unknown>),
    queryFn: ({ signal }) => getScientificReport(params, signal),
    staleTime: CACHE.MEDIUM,
  })
}

export function useTeachersReport(params: TeachersReportParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports.teachers(params as Record<string, unknown>),
    queryFn: ({ signal }) => getTeachersReport(params, signal),
    staleTime: CACHE.MEDIUM,
  })
}
