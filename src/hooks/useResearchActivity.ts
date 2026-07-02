import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { researchActivityApi, type ResearchActivityListParams } from '@/api/researchActivity.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated scientific activity registry list.
 */
export function useResearchActivity(params: {
  search?: string
  universityCode?: string
  educationYear?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.researchActivity.list({
      search: params.search,
      universityCode: params.universityCode,
      educationYear: params.educationYear,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      researchActivityApi.list(
        {
          q: params.search || undefined,
          universityCode:
            params.universityCode && params.universityCode !== 'all'
              ? params.universityCode
              : undefined,
          educationYear:
            params.educationYear && params.educationYear !== 'all'
              ? params.educationYear
              : undefined,
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch a single scientific activity detail by id.
 */
export function useResearchActivityDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.researchActivity.byId(id || ''),
    queryFn: ({ signal }) => researchActivityApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch scientific activity dictionaries.
 */
export function useResearchActivityDictionaries() {
  return useQuery({
    queryKey: queryKeys.researchActivity.dictionaries,
    queryFn: ({ signal }) => researchActivityApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the scientific activity registry to CSV.
 */
export function useExportResearchActivity() {
  return useMutation({
    mutationFn: (params: Omit<ResearchActivityListParams, 'page' | 'size' | 'sort'>) =>
      researchActivityApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `research_activity_${new Date().toISOString().slice(0, 10)}.csv`
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
