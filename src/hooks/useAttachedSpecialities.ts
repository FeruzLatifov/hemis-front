import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  attachedSpecialitiesApi,
  type AttachedSpecialitiesParams,
  type AttachedSpecialityCreate,
  type AttachedSpecialityUpdate,
} from '@/api/attachedSpecialities.api'
import { queryKeys } from '@/lib/queryKeys'
import { CACHE } from '@/constants/cache'
import { UI } from '@/constants'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'

/**
 * Hook to fetch a paginated list of attached specialities.
 */
export function useAttachedSpecialities(
  params: AttachedSpecialitiesParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.attachedSpecialities.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => attachedSpecialitiesApi.list(params, signal),
    placeholderData: keepPreviousData,
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  })
}

/**
 * Hook to fetch a single attached speciality by id.
 */
export function useAttachedSpeciality(id: string | null) {
  return useQuery({
    queryKey: queryKeys.attachedSpecialities.byId(id ?? ''),
    queryFn: ({ signal }) => attachedSpecialitiesApi.getById(id!, signal),
    enabled: !!id,
  })
}

/**
 * Hook to fetch attached-speciality dictionaries
 * (universities, education types/forms, specialities per level).
 */
export function useAttachedSpecialityDictionaries() {
  return useQuery({
    queryKey: queryKeys.attachedSpecialities.dictionaries,
    queryFn: ({ signal }) => attachedSpecialitiesApi.getDictionaries(signal),
    staleTime: CACHE.LONG,
  })
}

/**
 * Hook to create a new attached speciality.
 */
export function useCreateAttachedSpeciality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AttachedSpecialityCreate) => attachedSpecialitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachedSpecialities.all })
      toast.success(i18n.t('Attached speciality created'))
    },
  })
}

/**
 * Hook to update an existing attached speciality.
 */
export function useUpdateAttachedSpeciality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AttachedSpecialityUpdate }) =>
      attachedSpecialitiesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachedSpecialities.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.attachedSpecialities.byId(variables.id),
      })
      toast.success(i18n.t('Attached speciality updated'))
    },
  })
}

/**
 * Hook to delete (soft) an attached speciality.
 */
export function useDeleteAttachedSpeciality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => attachedSpecialitiesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachedSpecialities.all })
      toast.success(i18n.t('Attached speciality deleted'))
    },
  })
}

/**
 * Hook to export attached specialities to CSV.
 */
export function useExportAttachedSpecialities() {
  return useMutation({
    mutationFn: (params: Omit<AttachedSpecialitiesParams, 'page' | 'size' | 'sort'>) =>
      attachedSpecialitiesApi.export(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attached-specialities_${new Date().toISOString().slice(0, 10)}.csv`
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
