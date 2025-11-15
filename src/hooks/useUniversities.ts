import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { universitiesApi, type UniversitiesParams, type UniversityRow } from '@/api/universities.api'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'

/**
 * Hook to fetch paginated list of universities
 */
export function useUniversities(params: UniversitiesParams = {}) {
  return useQuery({
    queryKey: queryKeys.universities.list(params as Record<string, unknown>),
    queryFn: () => universitiesApi.getUniversities(params),
  })
}

/**
 * Hook to fetch a single university by code
 */
export function useUniversity(code: string) {
  return useQuery({
    queryKey: queryKeys.universities.byId(Number(code)),
    queryFn: () => universitiesApi.getUniversity(code),
    enabled: !!code, // Only fetch if code exists
  })
}

/**
 * Hook to fetch university dictionaries (ownerships, types, regions)
 */
export function useUniversityDictionaries() {
  return useQuery({
    queryKey: ['universities', 'dictionaries'],
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
    mutationFn: (data: Partial<UniversityRow>) => universitiesApi.createUniversity(data),
    onSuccess: () => {
      // Invalidate and refetch universities list
      queryClient.invalidateQueries({ queryKey: queryKeys.universities.all })
      toast.success('Universitet muvaffaqiyatli yaratildi')
    },
    onError: (error: Error) => {
      toast.error(`Xatolik: ${error.message}`)
    },
  })
}

/**
 * Hook to update an existing university
 */
export function useUpdateUniversity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ code, data }: { code: string; data: Partial<UniversityRow> }) =>
      universitiesApi.updateUniversity(code, data),
    onSuccess: (_, variables) => {
      // Invalidate specific university and list
      queryClient.invalidateQueries({ queryKey: queryKeys.universities.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.universities.byId(Number(variables.code)),
      })
      toast.success('Universitet muvaffaqiyatli yangilandi')
    },
    onError: (error: Error) => {
      toast.error(`Xatolik: ${error.message}`)
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
      toast.success('Universitet muvaffaqiyatli o\'chirildi')
    },
    onError: (error: Error) => {
      toast.error(`Xatolik: ${error.message}`)
    },
  })
}
