import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { employeeJobsApi, type EmployeeJobListParams } from '@/api/employeeJobs.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated employee jobs registry list.
 */
export function useEmployeeJobs(params: {
  search?: string
  universityCode?: string
  employeeType?: string
  active?: string
  page?: number
}) {
  return useQuery({
    queryKey: queryKeys.employeeJobs.list({
      search: params.search,
      universityCode: params.universityCode,
      employeeType: params.employeeType,
      active: params.active,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      employeeJobsApi.list(
        {
          q: params.search || undefined,
          universityCode:
            params.universityCode && params.universityCode !== 'all'
              ? params.universityCode
              : undefined,
          employeeType:
            params.employeeType && params.employeeType !== 'all' ? params.employeeType : undefined,
          active: params.active === 'all' ? undefined : params.active === 'true',
          page: params.page,
          size: PAGINATION.DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
  })
}

/**
 * Hook to fetch a single employee job detail by id.
 */
export function useEmployeeJobDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.employeeJobs.byId(id || ''),
    queryFn: ({ signal }) => employeeJobsApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch employee jobs dictionaries.
 */
export function useEmployeeJobDictionaries() {
  return useQuery({
    queryKey: queryKeys.employeeJobs.dictionaries,
    queryFn: ({ signal }) => employeeJobsApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export the employee jobs registry to CSV.
 */
export function useExportEmployeeJobs() {
  return useMutation({
    mutationFn: (params: Omit<EmployeeJobListParams, 'page' | 'size' | 'sort'>) =>
      employeeJobsApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `employee_jobs_${new Date().toISOString().slice(0, 10)}.csv`
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
