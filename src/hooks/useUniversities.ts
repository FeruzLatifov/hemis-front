import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  universitiesApi,
  type UniversitiesParams,
  type UniversityDetail,
} from '@/api/universities.api'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'
import i18n from '@/i18n/config'

/**
 * Hook to fetch paginated list of universities
 */
export function useUniversities(params: UniversitiesParams = {}) {
  return useQuery({
    queryKey: queryKeys.universities.list(params as Record<string, unknown>),
    queryFn: () => universitiesApi.getUniversities(params),
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook to fetch a single university by code
 */
export function useUniversity(code: string) {
  return useQuery({
    queryKey: queryKeys.universities.byId(code),
    queryFn: () => universitiesApi.getUniversity(code),
    enabled: !!code, // Only fetch if code exists
  })
}

/**
 * Hook to fetch university dictionaries (ownerships, types, regions)
 */
export function useUniversityDictionaries() {
  return useQuery({
    queryKey: queryKeys.universities.dictionaries,
    queryFn: () => universitiesApi.getDictionaries(),
    staleTime: 1000 * 60 * 60, // 1 hour - dictionaries don't change often
  })
}

/**
 * Hook to create a new university
 */
export function useCreateUniversity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<UniversityDetail>) => universitiesApi.createUniversity(data),
    onSuccess: () => {
      // Invalidate and refetch universities list
      queryClient.invalidateQueries({ queryKey: queryKeys.universities.all })
      toast.success(i18n.t('University successfully created'))
    },
    onError: (error: Error) => {
      toast.error(`${i18n.t('Error')}: ${error.message}`)
    },
  })
}

/**
 * Hook to update an existing university
 */
export function useUpdateUniversity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ code, data }: { code: string; data: Partial<UniversityDetail> }) =>
      universitiesApi.updateUniversity(code, data),
    onSuccess: (_, variables) => {
      // Invalidate specific university and list
      queryClient.invalidateQueries({ queryKey: queryKeys.universities.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.universities.byId(variables.code),
      })
      toast.success(i18n.t('University successfully updated'))
    },
    onError: (error: Error) => {
      toast.error(`${i18n.t('Error')}: ${error.message}`)
    },
  })
}

/**
 * Hook to delete a university
 */
export function useDeleteUniversity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => universitiesApi.deleteUniversity(code),
    onSuccess: () => {
      // Invalidate universities list
      queryClient.invalidateQueries({ queryKey: queryKeys.universities.all })
      toast.success(i18n.t('University successfully deleted'))
    },
    onError: (error: Error) => {
      toast.error(`${i18n.t('Error')}: ${error.message}`)
    },
  })
}
