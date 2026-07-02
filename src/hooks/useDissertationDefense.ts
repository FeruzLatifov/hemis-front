import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  dissertationDefenseApi,
  type DissertationDefenseListParams,
} from '@/api/dissertationDefense.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated dissertation defense registry list.
 */
export function useDissertationDefense(params: {
  search?: string
  universityCode?: string
  active?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.dissertationDefense.list({
      search: params.search,
      universityCode: params.universityCode,
      active: params.active,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      dissertationDefenseApi.list(
        {
          q: params.search || undefined,
          universityCode:
            params.universityCode && params.universityCode !== 'all'
              ? params.universityCode
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
 * Hook to fetch a single dissertation defense detail by id.
 */
export function useDissertationDefenseDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.dissertationDefense.byId(id || ''),
    queryFn: ({ signal }) => dissertationDefenseApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch dissertation defense dictionaries.
 */
export function useDissertationDefenseDictionaries() {
  return useQuery({
    queryKey: queryKeys.dissertationDefense.dictionaries,
    queryFn: ({ signal }) => dissertationDefenseApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the dissertation defense registry to CSV.
 */
export function useExportDissertationDefense() {
  return useMutation({
    mutationFn: (params: Omit<DissertationDefenseListParams, 'page' | 'size' | 'sort'>) =>
      dissertationDefenseApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dissertation_defense_${new Date().toISOString().slice(0, 10)}.csv`
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
