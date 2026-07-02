import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { publicationsApi, type PublicationListParams } from '@/api/publications.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated scientific publications registry list.
 */
export function usePublications(params: {
  search?: string
  universityCode?: string
  publicationType?: string
  issueYear?: string
  active?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.publications.list({
      search: params.search,
      universityCode: params.universityCode,
      publicationType: params.publicationType,
      issueYear: params.issueYear,
      active: params.active,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      publicationsApi.list(
        {
          q: params.search || undefined,
          universityCode:
            params.universityCode && params.universityCode !== 'all'
              ? params.universityCode
              : undefined,
          publicationType:
            params.publicationType && params.publicationType !== 'all'
              ? params.publicationType
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
 * Hook to fetch a single publication detail by id.
 */
export function usePublicationDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.publications.byId(id || ''),
    queryFn: ({ signal }) => publicationsApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch publication dictionaries.
 */
export function usePublicationDictionaries() {
  return useQuery({
    queryKey: queryKeys.publications.dictionaries,
    queryFn: ({ signal }) => publicationsApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the publications registry to CSV.
 */
export function useExportPublications() {
  return useMutation({
    mutationFn: (params: Omit<PublicationListParams, 'page' | 'size' | 'sort'>) =>
      publicationsApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `publications_${new Date().toISOString().slice(0, 10)}.csv`
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
