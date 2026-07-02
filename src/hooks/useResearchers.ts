import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { researchersApi, type ResearcherListParams } from '@/api/researchers.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated researchers (doctoral students) registry list.
 */
export function useResearchers(params: {
  search?: string
  universityCode?: string
  scienceBranch?: string
  doctoralStudentType?: string
  status?: string
  active?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.researchers.list({
      search: params.search,
      universityCode: params.universityCode,
      scienceBranch: params.scienceBranch,
      doctoralStudentType: params.doctoralStudentType,
      status: params.status,
      active: params.active,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      researchersApi.list(
        {
          q: params.search || undefined,
          universityCode:
            params.universityCode && params.universityCode !== 'all'
              ? params.universityCode
              : undefined,
          scienceBranch:
            params.scienceBranch && params.scienceBranch !== 'all'
              ? params.scienceBranch
              : undefined,
          doctoralStudentType:
            params.doctoralStudentType && params.doctoralStudentType !== 'all'
              ? params.doctoralStudentType
              : undefined,
          status: params.status && params.status !== 'all' ? params.status : undefined,
          active: params.active === 'all' ? undefined : params.active === 'true',
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch a single researcher detail by id.
 */
export function useResearcherDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.researchers.byId(id || ''),
    queryFn: ({ signal }) => researchersApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch researcher dictionaries.
 */
export function useResearcherDictionaries() {
  return useQuery({
    queryKey: queryKeys.researchers.dictionaries,
    queryFn: ({ signal }) => researchersApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the researchers registry to CSV.
 */
export function useExportResearchers() {
  return useMutation({
    mutationFn: (params: Omit<ResearcherListParams, 'page' | 'size' | 'sort'>) =>
      researchersApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `researchers_${new Date().toISOString().slice(0, 10)}.csv`
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
