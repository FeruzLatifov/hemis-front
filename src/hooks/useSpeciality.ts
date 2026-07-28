import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  specialityApi,
  type EducationLevel,
  type ReviewStatus,
  type SpecialityUpdatePayload,
} from '@/api/speciality.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/** Hierarchical tree for one education level (bachelor/master), or all levels when omitted. */
export function useSpecialityTree(educationLevel?: EducationLevel, enabled = true) {
  return useQuery({
    queryKey: queryKeys.speciality.tree(educationLevel),
    queryFn: ({ signal }) => specialityApi.tree(educationLevel, signal),
    staleTime: CACHE.LONG,
    enabled,
  })
}

/** Paginated flat curation grid — education-level + review-status + year + text filters. */
export function useSpecialityList(params: {
  educationLevel?: EducationLevel
  reviewStatus?: ReviewStatus
  q?: string
  year?: number
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: queryKeys.speciality.list(params),
    queryFn: ({ signal }) =>
      specialityApi.list(
        {
          educationLevel: params.educationLevel,
          reviewStatus: params.reviewStatus,
          q: params.q || undefined,
          year: params.year,
          page: params.page,
          size: params.size ?? PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/** Distinct edition years for the year-filter dropdown (newest first), scoped to the level. */
export function useSpecialityYears(educationLevel?: EducationLevel) {
  return useQuery({
    queryKey: queryKeys.speciality.years(educationLevel),
    queryFn: ({ signal }) => specialityApi.years(educationLevel, signal),
    staleTime: CACHE.LONG,
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
