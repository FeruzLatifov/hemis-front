import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  scientificProjectsApi,
  type ScientificProjectListParams,
} from '@/api/scientificProjects.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated scientific projects registry list.
 */
export function useScientificProjects(params: {
  search?: string
  universityCode?: string
  projectType?: string
  active?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.scientificProjects.list({
      search: params.search,
      universityCode: params.universityCode,
      projectType: params.projectType,
      active: params.active,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      scientificProjectsApi.list(
        {
          q: params.search || undefined,
          universityCode:
            params.universityCode && params.universityCode !== 'all'
              ? params.universityCode
              : undefined,
          projectType:
            params.projectType && params.projectType !== 'all' ? params.projectType : undefined,
          active: params.active === 'all' ? undefined : params.active === 'true',
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch a single scientific project detail by id.
 */
export function useScientificProjectDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.scientificProjects.byId(id || ''),
    queryFn: ({ signal }) => scientificProjectsApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch scientific project dictionaries.
 */
export function useScientificProjectDictionaries() {
  return useQuery({
    queryKey: queryKeys.scientificProjects.dictionaries,
    queryFn: ({ signal }) => scientificProjectsApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the scientific projects registry to CSV.
 */
export function useExportScientificProjects() {
  return useMutation({
    mutationFn: (params: Omit<ScientificProjectListParams, 'page' | 'size' | 'sort'>) =>
      scientificProjectsApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scientific_projects_${new Date().toISOString().slice(0, 10)}.csv`
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
