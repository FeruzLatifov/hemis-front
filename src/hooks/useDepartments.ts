import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { departmentsApi, type DepartmentRow, type PageResponse } from '@/api/departments.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'

/**
 * Hook to fetch university groups (root level of department tree)
 */
export function useDepartmentGroups(params: { search?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.departments.groups({
      search: params.search,
      status: params.status,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      departmentsApi.getGroups(
        {
          q: params.search || undefined,
          status: params.status === 'all' ? undefined : params.status === 'true',
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch departments for expanded universities
 */
export function useDepartmentsByUniversity(
  expandedCodes: string[],
  params: {
    departmentPages?: Record<string, number>
    search?: string
    status?: string
  },
) {
  return useQuery({
    queryKey: queryKeys.departments.byUniversity(expandedCodes, {
      departmentPages: params.departmentPages,
      search: params.search,
      status: params.status,
    }),
    queryFn: async ({ signal }) => {
      const results: Record<string, PageResponse<DepartmentRow>> = {}
      await Promise.all(
        expandedCodes.map(async (univCode) => {
          const departmentPage = params.departmentPages?.[univCode] || 0
          results[univCode] = await departmentsApi.getDepartmentsByUniversity(
            univCode,
            {
              q: params.search || undefined,
              status: params.status === 'all' ? undefined : params.status === 'true',
              page: departmentPage,
              size: PAGINATION.EXPANDED_PAGE_SIZE,
            },
            signal,
          )
        }),
      )
      return results
    },
    enabled: expandedCodes.length > 0,
  })
}

/**
 * Hook to fetch department detail by code
 */
export function useDepartmentDetail(code: string | null) {
  return useQuery({
    queryKey: queryKeys.departments.byId(code || ''),
    queryFn: ({ signal }) => departmentsApi.getDepartmentDetail(code!, signal),
    enabled: !!code,
  })
}

/**
 * Hook to export departments to Excel
 */
export function useExportDepartments() {
  return useMutation({
    mutationFn: (params: { q?: string; status?: boolean }) =>
      departmentsApi.exportDepartments(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `departments_${new Date().toISOString().slice(0, 10)}.csv`
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
