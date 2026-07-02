import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  universitySpecialitiesApi,
  type UniversitySpecialityListParams,
} from '@/api/universitySpecialities.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated institution specialities registry list.
 */
export function useUniversitySpecialities(params: {
  search?: string
  universityCode?: string
  educationType?: string
  active?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.universitySpecialities.list({
      search: params.search,
      universityCode: params.universityCode,
      educationType: params.educationType,
      active: params.active,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      universitySpecialitiesApi.list(
        {
          q: params.search || undefined,
          universityCode:
            params.universityCode && params.universityCode !== 'all'
              ? params.universityCode
              : undefined,
          educationType:
            params.educationType && params.educationType !== 'all'
              ? params.educationType
              : undefined,
          active: params.active === 'all' ? undefined : params.active === 'true',
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch a single institution speciality detail by id.
 */
export function useUniversitySpecialityDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.universitySpecialities.byId(id || ''),
    queryFn: ({ signal }) => universitySpecialitiesApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch institution specialities dictionaries.
 */
export function useUniversitySpecialityDictionaries() {
  return useQuery({
    queryKey: queryKeys.universitySpecialities.dictionaries,
    queryFn: ({ signal }) => universitySpecialitiesApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the institution specialities registry to CSV.
 */
export function useExportUniversitySpecialities() {
  return useMutation({
    mutationFn: (params: Omit<UniversitySpecialityListParams, 'page' | 'size' | 'sort'>) =>
      universitySpecialitiesApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `university_specialities_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(i18n.t('Download Excel'), {
        duration: UI.TOAST_DURATION,
      })
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Export failed')), {
        duration: UI.TOAST_ERROR_DURATION,
      })
    },
  })
}
