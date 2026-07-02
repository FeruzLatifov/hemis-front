import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { certificatesApi, type CertificateListParams } from '@/api/certificates.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated certificates registry list.
 */
export function useCertificates(params: {
  search?: string
  universityCode?: string
  certificateType?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.certificates.list({
      search: params.search,
      universityCode: params.universityCode,
      certificateType: params.certificateType,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      certificatesApi.list(
        {
          q: params.search || undefined,
          universityCode:
            params.universityCode && params.universityCode !== 'all'
              ? params.universityCode
              : undefined,
          certificateType:
            params.certificateType && params.certificateType !== 'all'
              ? params.certificateType
              : undefined,
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch a single certificate detail by id.
 */
export function useCertificateDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.certificates.byId(id || ''),
    queryFn: ({ signal }) => certificatesApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch certificate dictionaries (universities, certificate types).
 */
export function useCertificateDictionaries() {
  return useQuery({
    queryKey: queryKeys.certificates.dictionaries,
    queryFn: ({ signal }) => certificatesApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the certificates registry to CSV.
 */
export function useExportCertificates() {
  return useMutation({
    mutationFn: (params: Omit<CertificateListParams, 'page' | 'size' | 'sort'>) =>
      certificatesApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificates_${new Date().toISOString().slice(0, 10)}.csv`
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
