import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { diplomaBlanksApi, type DiplomaBlankListParams } from '@/api/diplomaBlanks.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated diploma-blanks registry list (read-only).
 */
export function useDiplomaBlanks(
  params: DiplomaBlankListParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.diplomaBlanks.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => diplomaBlanksApi.list(params, signal),
    placeholderData: keepPreviousData,
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  })
}

/**
 * Hook to fetch a single diploma-blank detail by id.
 */
export function useDiplomaBlankDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.diplomaBlanks.byId(id ?? ''),
    queryFn: ({ signal }) => diplomaBlanksApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch diploma-blank dictionaries (universities, statuses).
 */
export function useDiplomaBlankDictionaries() {
  return useQuery({
    queryKey: queryKeys.diplomaBlanks.dictionaries,
    queryFn: ({ signal }) => diplomaBlanksApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the diploma-blanks registry to CSV.
 */
export function useExportDiplomaBlanks() {
  return useMutation({
    mutationFn: (params: Omit<DiplomaBlankListParams, 'page' | 'size' | 'sort'>) =>
      diplomaBlanksApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diploma-blanks_${new Date().toISOString().slice(0, 10)}.csv`
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
