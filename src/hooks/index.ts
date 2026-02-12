/**
 * Custom Hooks Barrel Export
 *
 * Import as: import { useDebounce, usePagination, useUniversities } from '@/hooks'
 */

// Performance hooks
export { useDebounce, useDebouncedCallback } from './useDebounce'
export { usePagination, type PaginationState, type UsePaginationReturn } from './usePagination'
export { useStableCallback, useStableValue } from './useStableCallback'
export { useIdleTimeout } from './useIdleTimeout'
export {
  useAbortController,
  useMountedState,
  isAbortError,
  type UseAbortControllerReturn,
} from './useAbortController'

// Application hooks
export { useClearCache } from './useClearCache'
export { useMenuInit } from './useMenuInit'
export { useTheme, ThemeProviderContext, type Theme, type ThemeProviderState } from './useTheme'

// Form hooks
export {
  useUnsavedChanges,
  useFormDirtyState,
  type UseUnsavedChangesOptions,
  type UseUnsavedChangesReturn,
} from './useUnsavedChanges'

// Accessibility hooks
export { useFocusTrap, useAnnounce } from './useFocusTrap'

// Error recovery hooks
export {
  useOnlineStatus,
  useRetry,
  useOfflineNotification,
  classifyError,
  isRetryableError,
  type ErrorType,
  type UseRetryOptions,
  type UseRetryReturn,
} from './useErrorRecovery'

// Data hooks
export {
  useUniversities,
  useUniversity,
  useUniversityDictionaries,
  useCreateUniversity,
  useUpdateUniversity,
  useDeleteUniversity,
} from './useUniversities'

export { useDashboardStats } from './useDashboard'

export {
  useFacultyGroups,
  useFacultiesByUniversity,
  useFacultyDetail,
  useExportFaculties,
} from './useFaculties'

export {
  useTranslations,
  useTranslationById,
  useToggleTranslationActive,
  useClearTranslationCache,
  useRegeneratePropertiesFiles,
  useUpdateTranslation,
  useFindDuplicateMessages,
  useDownloadTranslationsAsJson,
} from './useTranslations'
