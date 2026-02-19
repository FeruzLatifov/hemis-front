import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { queryKeys } from '@/lib/queryKeys'
import {
  classifiersApi,
  type ClassifierItemsParams,
  type ClassifierItemCreate,
  type ClassifierItemUpdate,
} from '@/api/classifiers.api'

export function useClassifierCategories() {
  return useQuery({
    queryKey: queryKeys.classifiers.categories,
    queryFn: ({ signal }) => classifiersApi.getCategories(signal),
    staleTime: 1000 * 60 * 60, // 1 hour — categories rarely change
  })
}

export function useClassifiersByCategory(category: string) {
  return useQuery({
    queryKey: queryKeys.classifiers.byCategory(category),
    queryFn: ({ signal }) => classifiersApi.getClassifiersByCategory(category, signal),
    enabled: !!category,
  })
}

export function useClassifierItems(apiKey: string, params: ClassifierItemsParams = {}) {
  return useQuery({
    queryKey: queryKeys.classifiers.items(apiKey, params as Record<string, unknown>),
    queryFn: ({ signal }) => classifiersApi.getClassifierItems(apiKey, params, signal),
    enabled: !!apiKey,
    placeholderData: keepPreviousData,
  })
}

export function useCreateClassifierItem(apiKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ClassifierItemCreate) => classifiersApi.createClassifierItem(apiKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classifiers.all })
      toast.success(i18n.t('Classifier item created'))
    },
    onError: (error: Error) => {
      toast.error(`${i18n.t('Error')}: ${error.message}`)
    },
  })
}

export function useUpdateClassifierItem(apiKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ code, data }: { code: string; data: ClassifierItemUpdate }) =>
      classifiersApi.updateClassifierItem(apiKey, code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classifiers.all })
      toast.success(i18n.t('Classifier item updated'))
    },
    onError: (error: Error) => {
      toast.error(`${i18n.t('Error')}: ${error.message}`)
    },
  })
}

export function useDeleteClassifierItem(apiKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => classifiersApi.deleteClassifierItem(apiKey, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classifiers.all })
      toast.success(i18n.t('Classifier item deleted'))
    },
    onError: (error: Error) => {
      toast.error(`${i18n.t('Error')}: ${error.message}`)
    },
  })
}
