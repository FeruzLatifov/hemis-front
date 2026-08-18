import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  specialityApi,
  type EducationTypeCode,
  type ReviewStatus,
  type SpecialityCreatePayload,
  type SpecialityDuplicateParams,
  type SpecialityUpdatePayload,
} from '@/api/speciality.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/** Hierarchical tree for one education type (bachelor/master), or all types when omitted. */
export function useSpecialityTree(educationType?: EducationTypeCode, enabled = true) {
  return useQuery({
    queryKey: queryKeys.speciality.tree(educationType),
    queryFn: ({ signal }) => specialityApi.tree(educationType, signal),
    staleTime: CACHE.LONG,
    enabled,
  })
}

/**
 * Paginated flat curation grid — education-level + review-status + year + text filters.
 * `enabled` gates the fetch so the list query stays idle while the Tree view is active
 * (Tree is the default landing view — no point fetching the flat grid nobody is looking at).
 */
export function useSpecialityList(
  params: {
    educationType?: EducationTypeCode
    reviewStatus?: ReviewStatus
    q?: string
    year?: number
    page?: number
    size?: number
  },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.speciality.list(params),
    queryFn: ({ signal }) =>
      specialityApi.list(
        {
          educationType: params.educationType,
          reviewStatus: params.reviewStatus,
          q: params.q || undefined,
          year: params.year,
          page: params.page,
          size: params.size ?? PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
    enabled,
  })
}

/** Distinct edition years for the year-filter dropdown (newest first), scoped to the type. */
export function useSpecialityYears(educationType?: EducationTypeCode) {
  return useQuery({
    queryKey: queryKeys.speciality.years(educationType),
    queryFn: ({ signal }) => specialityApi.years(educationType, signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Education types the classifier admits (Bakalavr/Magistr) — the Ta'lim turi dropdown source for the
 * Create/Edit dialogs. Reference data, cached long. Served under the classifier's own permission.
 */
export function useSpecialityEducationTypes() {
  return useQuery({
    queryKey: queryKeys.speciality.educationTypes,
    queryFn: ({ signal }) => specialityApi.educationTypes(signal),
    staleTime: CACHE.LONG,
  })
}

/** Advisory duplicate check for the add form — existing rows with the same code/name. */
export function useSpecialityDuplicates(params: SpecialityDuplicateParams, enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.speciality.all, 'duplicates', params],
    queryFn: ({ signal }) => specialityApi.duplicates(params, signal),
    enabled,
    staleTime: 0,
  })
}

/** Single node with years and direct children. */
export function useSpecialityDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.speciality.byId(id || ''),
    queryFn: ({ signal }) => specialityApi.getById(id!, signal),
    enabled: !!id,
  })
}

/** Curate a speciality (fix + promote NEEDS_REVIEW → APPROVED). */
export function useUpdateSpeciality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SpecialityUpdatePayload }) =>
      specialityApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.speciality.all })
      toast.success(i18n.t('Saved successfully'), { duration: UI.TOAST_DURATION })
    },
  })
}

/** Manually add a new speciality (born NEEDS_REVIEW; promote later via update). */
export function useCreateSpeciality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SpecialityCreatePayload) => specialityApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.speciality.all })
      toast.success(i18n.t('Speciality created'), { duration: UI.TOAST_DURATION })
    },
    // No onError toast: a duplicate create returns 409 with the specific backend message
    // ("…same code and name already exists for the given year(s)…"), which the global axios
    // interceptor (client.ts) already surfaces for 400/409/422. A generic fallback here would
    // just stack a second, less-informative toast on top. Mirrors useUpdateSpeciality.
  })
}
