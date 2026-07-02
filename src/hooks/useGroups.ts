import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { groupsApi, type GroupRegistryRow, type PageResponse } from '@/api/groups.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { PAGINATION, UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch university groups (root level of the study-group tree)
 */
export function useGroupGroups(params: { search?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.groups.groups({
      search: params.search,
      status: params.status,
      page: params.page,
    }),
    queryFn: ({ signal }) =>
      groupsApi.getGroupGroups(
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
 * Hook to fetch study groups for expanded universities
 */
export function useGroupsByUniversity(
  expandedCodes: string[],
  params: {
    groupPages?: Record<string, number>
    search?: string
    educationType?: string
    educationYear?: string
    status?: string
  },
) {
  return useQuery({
    queryKey: queryKeys.groups.byUniversity(expandedCodes, {
      groupPages: params.groupPages,
      search: params.search,
      educationType: params.educationType,
      educationYear: params.educationYear,
      status: params.status,
    }),
    queryFn: async ({ signal }) => {
      const results: Record<string, PageResponse<GroupRegistryRow>> = {}
      await Promise.all(
        expandedCodes.map(async (univCode) => {
          const groupPage = params.groupPages?.[univCode] || 0
          results[univCode] = await groupsApi.getGroupsByUniversity(
            univCode,
            {
              q: params.search || undefined,
              educationType:
                params.educationType && params.educationType !== 'all'
                  ? params.educationType
                  : undefined,
              educationYear:
                params.educationYear && params.educationYear !== 'all'
                  ? params.educationYear
                  : undefined,
              status: params.status === 'all' ? undefined : params.status === 'true',
              page: groupPage,
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
 * Hook to fetch study-group detail by id
 */
export function useGroupDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.groups.byId(id || ''),
    queryFn: ({ signal }) => groupsApi.getGroupDetail(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch study-group dictionaries (education types/years, statuses)
 */
export function useGroupDictionaries() {
  return useQuery({
    queryKey: queryKeys.groups.dictionaries,
    queryFn: ({ signal }) => groupsApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to export study groups to CSV
 */
export function useExportGroups() {
  return useMutation({
    mutationFn: (params: {
      q?: string
      educationType?: string
      educationYear?: string
      status?: boolean
    }) => groupsApi.exportGroups(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `groups_${new Date().toISOString().slice(0, 10)}.csv`
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
