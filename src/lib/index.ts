/**
 * Library Utilities Barrel Export
 *
 * Import as: import { queryClient, cn, captureError } from '@/lib'
 */

// Query management
export { queryClient } from './queryClient'
export { queryKeys } from './queryKeys'
export {
  createOptimisticMutation,
  listQueryOptions,
  detailQueryOptions,
  dictionaryQueryOptions,
  createCancellableRequest,
  withCancellation,
  defaultQueryOptions,
  type OptimisticMutationOptions,
  type StandardQueryOptions,
} from './queryConfig'

// Utilities
export { cn } from './utils'

// Error tracking
export { initSentry, captureError, addBreadcrumb } from './sentry'

// Security
export {
  SECURITY_CONFIG,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  sanitizeForLogging,
  containsXSSPattern,
  validateFileUpload,
} from './security'
