import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  getTranslations,
  getTranslationById,
  updateTranslation,
  toggleTranslationActive,
  clearTranslationCache,
  regeneratePropertiesFiles,
  findDuplicateMessages,
  downloadAllTranslationsAsJson,
  type TranslationUpdateRequest,
} from '@/api/translations.api'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'

/**
 * Invalidate all translations queries
 */
function useInvalidateTranslations() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey
        return Array.isArray(key) && key[0] === 'translations'
      },
    })
  }
}

/**
 * Hook to fetch paginated translations list
 */
export function useTranslations(params: {
  page?: number
  size?: number
  category?: string
  search?: string
  active?: boolean
}) {
  return useQuery({
    queryKey: queryKeys.translations.list({
      page: params.page,
      size: params.size,
      categoryFilter: params.category,
      searchFilter: params.search,
      activeFilter: params.active,
    }),
    queryFn: () =>
      getTranslations({
        category: params.category || undefined,
        search: params.search || undefined,
        active: params.active,
        page: params.page,
        size: params.size,
        sortBy: 'category',
        sortDir: 'ASC',
      }),
  })
}

/**
 * Hook to fetch a single translation by ID
 */
export function useTranslationById(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.translations.byId(id || ''),
    queryFn: () => getTranslationById(id!),
    enabled: !!id,
  })
}

/**
 * Hook to toggle translation active status
 */
export function useToggleTranslationActive() {
  const invalidate = useInvalidateTranslations()

  return useMutation({
    mutationFn: toggleTranslationActive,
    onSuccess: (result) => {
      invalidate()
      toast.success(
        result.active ? i18n.t('Translation activated') : i18n.t('Translation deactivated'),
      )
    },
    onError: (err: unknown) => {
      toast.error(extractApiErrorMessage(err, i18n.t('Failed to toggle active status')))
    },
  })
}

/**
 * Hook to clear translation cache
 */
export function useClearTranslationCache() {
  const invalidate = useInvalidateTranslations()

  return useMutation({
    mutationFn: clearTranslationCache,
    onSuccess: (result) => {
      invalidate()
      toast.success(result.message || i18n.t('Cache cleared successfully'), {
        duration: 3000,
        position: 'bottom-right',
      })
    },
    onError: (err: unknown) => {
      toast.error(extractApiErrorMessage(err, i18n.t('Error clearing cache')), {
        duration: 5000,
        position: 'bottom-right',
      })
    },
  })
}

/**
 * Hook to regenerate properties files
 */
export function useRegeneratePropertiesFiles() {
  const invalidate = useInvalidateTranslations()

  return useMutation({
    mutationFn: regeneratePropertiesFiles,
    onSuccess: (result) => {
      invalidate()
      toast.success(
        `${result.totalFiles} ${i18n.t('files created')} (${result.totalTranslations} ${i18n.t('translations')})`,
        { duration: 4000, position: 'bottom-right' },
      )
    },
    onError: (err: unknown) => {
      toast.error(extractApiErrorMessage(err, i18n.t('Error generating properties')), {
        duration: 5000,
        position: 'bottom-right',
      })
    },
  })
}

/**
 * Hook to update a translation
 */
export function useUpdateTranslation() {
  const invalidate = useInvalidateTranslations()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TranslationUpdateRequest }) =>
      updateTranslation(id, data),
    onSuccess: () => {
      invalidate()
      toast.success(i18n.t('Translation successfully updated'), {
        duration: 3000,
        position: 'bottom-right',
      })
    },
    onError: (err: unknown) => {
      toast.error(extractApiErrorMessage(err, i18n.t('Error saving translation')), {
        duration: 5000,
        position: 'bottom-right',
      })
    },
  })
}

/**
 * Hook to find duplicate messages
 */
export function useFindDuplicateMessages() {
  return useMutation({
    mutationFn: findDuplicateMessages,
    onError: (err: unknown) => {
      toast.error(extractApiErrorMessage(err, i18n.t('Error checking duplicates')), {
        duration: 5000,
      })
    },
  })
}

/**
 * Hook to download all translations as JSON
 */
export function useDownloadTranslationsAsJson() {
  return useMutation({
    mutationFn: downloadAllTranslationsAsJson,
    onSuccess: (result) => {
      toast.success(
        `${result.downloaded.length} ${i18n.t('JSON files downloaded')}: ${result.downloaded.join(', ')}`,
        { duration: 4000, position: 'bottom-right' },
      )
    },
    onError: (err: unknown) => {
      toast.error(extractApiErrorMessage(err, i18n.t('Error downloading JSON')), {
        duration: 5000,
      })
    },
  })
}
