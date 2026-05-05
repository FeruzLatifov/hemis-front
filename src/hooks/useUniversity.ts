import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { universityApi } from '@/api/university.api'
import { queryKeys } from '@/lib/queryKeys'
import { extractApiErrorMessage } from '@/utils/error.util'

export function useUniversityDashboard(code: string) {
  return useQuery({
    queryKey: queryKeys.universityInfo.dashboard(code),
    queryFn: ({ signal }) => universityApi.getDashboard(code, signal),
    enabled: !!code,
  })
}

export function useUniversityFounders(code: string) {
  return useQuery({
    queryKey: queryKeys.universityInfo.founders(code),
    queryFn: ({ signal }) => universityApi.getFounders(code, signal),
    enabled: !!code,
  })
}

export function useUniversityLifecycle(code: string) {
  return useQuery({
    queryKey: queryKeys.universityInfo.lifecycle(code),
    queryFn: ({ signal }) => universityApi.getLifecycle(code, signal),
    enabled: !!code,
  })
}

export function useUniversityCadastre(code: string) {
  return useQuery({
    queryKey: queryKeys.universityInfo.cadastre(code),
    queryFn: ({ signal }) => universityApi.getCadastre(code, signal),
    enabled: !!code,
  })
}

export function useUniversityOfficials(code: string, history = false) {
  return useQuery({
    queryKey: [...queryKeys.universityInfo.all, 'officials', code, history] as const,
    queryFn: ({ signal }) => universityApi.getOfficials(code, history, signal),
    enabled: !!code,
  })
}

export function useAppointOfficial(code: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof universityApi.appointOfficial>[1]) =>
      universityApi.appointOfficial(code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.universityInfo.all })
      toast.success(i18n.t('Official appointed successfully'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to appoint official')))
    },
  })
}

export function useRemoveOfficial(code: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ metaId, decree }: { metaId: string; decree?: string }) =>
      universityApi.removeOfficial(code, metaId, decree),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.universityInfo.all })
      toast.success(i18n.t('Official removed'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to remove official')))
    },
  })
}

export function useAddLifecycleEvent(code: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (event: Parameters<typeof universityApi.addLifecycleEvent>[1]) =>
      universityApi.addLifecycleEvent(code, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.universityInfo.dashboard(code) })
      toast.success(i18n.t('Lifecycle event added'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to add lifecycle event')))
    },
  })
}

export function useUniversityProfile(code: string) {
  return useQuery({
    queryKey: queryKeys.universityInfo.profile(code),
    queryFn: ({ signal }) => universityApi.getProfile(code, signal),
    enabled: !!code,
  })
}

export function useUpdateUniversityProfile(code: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof universityApi.updateProfile>[1]) =>
      universityApi.updateProfile(code, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.universityInfo.profile(code), data)
      toast.success(i18n.t('Profile saved'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to save profile')))
    },
  })
}

export function useSyncUniversityData(code: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => universityApi.syncAll(code),
    onSuccess: () => {
      // Invalidate both external data AND university detail (address, bank_info updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.universityInfo.dashboard(code) })
      queryClient.invalidateQueries({ queryKey: queryKeys.universities.all })
      toast.success(i18n.t('External data synced successfully'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to sync external data')))
    },
  })
}
