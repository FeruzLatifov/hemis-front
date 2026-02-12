/**
 * Utility Functions Barrel Export
 *
 * Import as: import { extractApiErrorMessage, getIcon, sanitizeUrl } from '@/utils'
 */

// Error handling utilities
export { extractApiErrorMessage, isNetworkError, getErrorStatus } from './error.util'

// Icon mapping
export { getIcon } from './iconMapper'

// URL utilities
export { sanitizeUrl, isTrustedDomain } from './url.util'

// Menu utilities
export { getMenuLabel } from './menu.util'
