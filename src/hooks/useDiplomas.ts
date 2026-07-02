import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { diplomasApi, type DiplomaListParams } from '@/api/diplomas.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated diplomas registry list.
 */
export function useDiplomas(params: {
  search?: string
  universityCode?: string
  educationYear?: string
  verify?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.diplomas.list({
      search: params.search,
      universityCode: params.universityCode,
      educationYear: params.educationYear,
      verify: params.verify,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      diplomasApi.list(
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
          verify: params.verify === 'all' ? undefined : params.verify === 'true',
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch a single diploma detail by id.
 */
export function useDiplomaDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.diplomas.byId(id || ''),
    queryFn: ({ signal }) => diplomasApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch diploma dictionaries (universities, education years).
 */
export function useDiplomaDictionaries() {
  return useQuery({
    queryKey: queryKeys.diplomas.dictionaries,
    queryFn: ({ signal }) => diplomasApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the diplomas registry to CSV.
 */
export function useExportDiplomas() {
  return useMutation({
    mutationFn: (params: Omit<DiplomaListParams, 'page' | 'size' | 'sort'>) =>
      diplomasApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diplomas_${new Date().toISOString().slice(0, 10)}.csv`
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
