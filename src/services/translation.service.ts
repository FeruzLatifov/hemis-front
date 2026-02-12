/**
 * Translation Service
 *
 * Business logic for translation management.
 * TODO: Implement when API types are standardized
 */

// Re-export API functions for backwards compatibility
export {
  getTranslations,
  getTranslationById,
  updateTranslation,
  toggleTranslationActive,
  getTranslationStatistics,
  clearTranslationCache,
  exportTranslations,
  regeneratePropertiesFiles,
  findDuplicateMessages,
  searchByMessageText,
  downloadTranslationsAsJson,
  downloadAllTranslationsAsJson,
} from '@/api/translations.api'
