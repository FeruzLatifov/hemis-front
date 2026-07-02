import { useQuery } from '@tanstack/react-query'
import {
  getAdministrativeRating,
  getAcademicRating,
  getScientificRating,
  getGpaRating,
  type AdministrativeRatingParams,
  type AcademicRatingParams,
  type ScientificRatingParams,
  type GpaRatingParams,
} from '@/api/ratings.api'
import { queryKeys } from '@/lib/queryKeys'
import { CACHE } from '@/constants/cache'

/**
 * Ministry rating hooks — one thin useQuery per leaderboard, all sharing the
 * ReportDto contract. The backend @Cacheable already caches the heavy per-OTM
 * ranking, so a MEDIUM staleTime keeps the UI snappy without re-hammering the
 * replica on every filter tweak.
 */

export function useAdministrativeRating(params: AdministrativeRatingParams = {}) {
  return useQuery({
    queryKey: queryKeys.ratings.administrative(params as Record<string, unknown>),
    queryFn: ({ signal }) => getAdministrativeRating(params, signal),
    staleTime: CACHE.MEDIUM,
  })
}

export function useAcademicRating(params: AcademicRatingParams = {}) {
  return useQuery({
    queryKey: queryKeys.ratings.academic(params as Record<string, unknown>),
    queryFn: ({ signal }) => getAcademicRating(params, signal),
    staleTime: CACHE.MEDIUM,
  })
}

export function useScientificRating(params: ScientificRatingParams = {}) {
  return useQuery({
    queryKey: queryKeys.ratings.scientific(params as Record<string, unknown>),
    queryFn: ({ signal }) => getScientificRating(params, signal),
    staleTime: CACHE.MEDIUM,
  })
}

export function useGpaRating(params: GpaRatingParams = {}) {
  return useQuery({
    queryKey: queryKeys.ratings.gpa(params as Record<string, unknown>),
    queryFn: ({ signal }) => getGpaRating(params, signal),
    staleTime: CACHE.MEDIUM,
  })
}
