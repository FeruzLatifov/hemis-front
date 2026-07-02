import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  diplomaBlankDistributionApi,
  type DiplomaBlankDistributionParams,
  type DiplomaBlankDistributionCreate,
  type DiplomaBlankDistributionUpdate,
} from '@/api/diplomaBlankDistribution.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import { UI } from '@/constants'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch the paginated diploma-blank-distribution list.
 */
export function useDiplomaBlankDistributions(
  params: DiplomaBlankDistributionParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.diplomaBlankDistribution.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => diplomaBlankDistributionApi.list(params, signal),
    placeholderData: keepPreviousData,
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  })
}

/**
 * Hook to fetch a single distribution detail by id.
 */
export function useDiplomaBlankDistribution(id: string | null) {
  return useQuery({
    queryKey: queryKeys.diplomaBlankDistribution.byId(id ?? ''),
    queryFn: ({ signal }) => diplomaBlankDistributionApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch distribution dictionaries
 * (universities, education years/types, blank categories, generate statuses).
 */
export function useDiplomaBlankDistributionDictionaries() {
  return useQuery({
    queryKey: queryKeys.diplomaBlankDistribution.dictionaries,
    queryFn: ({ signal }) => diplomaBlankDistributionApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to create a new distribution.
 */
export function useCreateDiplomaBlankDistribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DiplomaBlankDistributionCreate) => diplomaBlankDistributionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diplomaBlankDistribution.all })
      toast.success(i18n.t('Successfully created'))
    },
  })
}

/**
 * Hook to update an existing distribution.
 */
export function useUpdateDiplomaBlankDistribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DiplomaBlankDistributionUpdate }) =>
      diplomaBlankDistributionApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diplomaBlankDistribution.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.diplomaBlankDistribution.byId(variables.id),
      })
      toast.success(i18n.t('Successfully updated'))
    },
  })
}

/**
 * Hook to delete (soft) a distribution.
 */
export function useDeleteDiplomaBlankDistribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => diplomaBlankDistributionApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diplomaBlankDistribution.all })
      toast.success(i18n.t('Successfully deleted'))
    },
  })
}

/**
 * Hook to export the distribution list to CSV.
 */
export function useExportDiplomaBlankDistributions() {
  return useMutation({
    mutationFn: (params: Omit<DiplomaBlankDistributionParams, 'page' | 'size' | 'sort'>) =>
      diplomaBlankDistributionApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diploma-blank-distribution_${new Date().toISOString().slice(0, 10)}.csv`
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
