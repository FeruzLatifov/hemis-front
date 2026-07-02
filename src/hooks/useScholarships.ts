import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { scholarshipsApi, type ScholarshipListParams } from '@/api/scholarships.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated scholarships registry list.
 */
export function useScholarships(params: {
  search?: string
  universityCode?: string
  educationYear?: string
  stipendCategory?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.scholarships.list({
      search: params.search,
      universityCode: params.universityCode,
      educationYear: params.educationYear,
      stipendCategory: params.stipendCategory,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      scholarshipsApi.list(
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
          stipendCategory:
            params.stipendCategory && params.stipendCategory !== 'all'
              ? params.stipendCategory
              : undefined,
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch a single scholarship detail by id.
 */
export function useScholarshipDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.scholarships.byId(id || ''),
    queryFn: ({ signal }) => scholarshipsApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch scholarship dictionaries (universities, education years).
 */
export function useScholarshipDictionaries() {
  return useQuery({
    queryKey: queryKeys.scholarships.dictionaries,
    queryFn: ({ signal }) => scholarshipsApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the scholarships registry to CSV.
 */
export function useExportScholarships() {
  return useMutation({
    mutationFn: (params: Omit<ScholarshipListParams, 'page' | 'size' | 'sort'>) =>
      scholarshipsApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scholarships_${new Date().toISOString().slice(0, 10)}.csv`
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
