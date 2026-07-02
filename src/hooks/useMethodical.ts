import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { methodicalApi, type MethodicalListParams } from '@/api/methodical.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated methodical publications registry list.
 */
export function useMethodical(params: {
  search?: string
  universityCode?: string
  methodicalType?: string
  issueYear?: string
  active?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.methodical.list({
      search: params.search,
      universityCode: params.universityCode,
      methodicalType: params.methodicalType,
      issueYear: params.issueYear,
      active: params.active,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      methodicalApi.list(
        {
          q: params.search || undefined,
          universityCode:
            params.universityCode && params.universityCode !== 'all'
              ? params.universityCode
              : undefined,
          methodicalType:
            params.methodicalType && params.methodicalType !== 'all'
              ? params.methodicalType
              : undefined,
          issueYear: params.issueYear || undefined,
          active: params.active === 'all' ? undefined : params.active === 'true',
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch a single methodical publication detail by id.
 */
export function useMethodicalDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.methodical.byId(id || ''),
    queryFn: ({ signal }) => methodicalApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch methodical publication dictionaries.
 */
export function useMethodicalDictionaries() {
  return useQuery({
    queryKey: queryKeys.methodical.dictionaries,
    queryFn: ({ signal }) => methodicalApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the methodical publications registry to CSV.
 */
export function useExportMethodical() {
  return useMutation({
    mutationFn: (params: Omit<MethodicalListParams, 'page' | 'size' | 'sort'>) =>
      methodicalApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `methodical_${new Date().toISOString().slice(0, 10)}.csv`
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
