import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { facultiesApi, type FacultyRow, type PageResponse } from '@/api/faculties.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'

/**
 * Hook to fetch university groups (root level of faculty tree)
 */
export function useFacultyGroups(params: { search?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.faculties.groups({
      search: params.search,
      status: params.status,
      page: params.page,
    }),
    queryFn: () =>
      facultiesApi.getGroups({
        q: params.search || undefined,
        status: params.status === 'all' ? undefined : params.status === 'true',
        page: params.page,
        size: 20,
      }),
  })
}

/**
 * Hook to fetch faculties for expanded universities
 */
export function useFacultiesByUniversity(
  expandedCodes: string[],
  params: {
    facultyPages?: Record<string, number>
    search?: string
    status?: string
  },
) {
  return useQuery({
    queryKey: queryKeys.faculties.byUniversity(expandedCodes, {
      facultyPages: params.facultyPages,
      search: params.search,
      status: params.status,
    }),
    queryFn: async () => {
      const results: Record<string, PageResponse<FacultyRow>> = {}
      await Promise.all(
        expandedCodes.map(async (univCode) => {
          const facultyPage = params.facultyPages?.[univCode] || 0
          results[univCode] = await facultiesApi.getFacultiesByUniversity(univCode, {
            q: params.search || undefined,
            status: params.status === 'all' ? undefined : params.status === 'true',
            page: facultyPage,
            size: 50,
          })
        }),
      )
      return results
    },
    enabled: expandedCodes.length > 0,
  })
}

/**
 * Hook to fetch faculty detail by code
 */
export function useFacultyDetail(code: string | null) {
  return useQuery({
    queryKey: queryKeys.faculties.byId(code || ''),
    queryFn: () => facultiesApi.getFacultyDetail(code!),
    enabled: !!code,
  })
}

/**
 * Hook to export faculties to Excel
 */
export function useExportFaculties() {
  return useMutation({
    mutationFn: (params: { q?: string; status?: boolean }) => facultiesApi.exportFaculties(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `faculties_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(i18n.t('Download Excel'), {
        duration: 3000,
        position: 'bottom-right',
      })
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Export failed')), {
        duration: 5000,
        position: 'bottom-right',
      })
    },
  })
}
