import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { intellectualApi, type IntellectualListParams } from '@/api/intellectual.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated intellectual property registry list.
 */
export function useIntellectual(params: {
  search?: string
  universityCode?: string
  patentType?: string
  active?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.intellectual.list({
      search: params.search,
      universityCode: params.universityCode,
      patentType: params.patentType,
      active: params.active,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      intellectualApi.list(
        {
          q: params.search || undefined,
          universityCode:
            params.universityCode && params.universityCode !== 'all'
              ? params.universityCode
              : undefined,
          patentType:
            params.patentType && params.patentType !== 'all' ? params.patentType : undefined,
          active: params.active === 'all' ? undefined : params.active === 'true',
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch a single intellectual property detail by id.
 */
export function useIntellectualDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.intellectual.byId(id || ''),
    queryFn: ({ signal }) => intellectualApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch intellectual property dictionaries.
 */
export function useIntellectualDictionaries() {
  return useQuery({
    queryKey: queryKeys.intellectual.dictionaries,
    queryFn: ({ signal }) => intellectualApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the intellectual property registry to CSV.
 */
export function useExportIntellectual() {
  return useMutation({
    mutationFn: (params: Omit<IntellectualListParams, 'page' | 'size' | 'sort'>) =>
      intellectualApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `intellectual_${new Date().toISOString().slice(0, 10)}.csv`
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
