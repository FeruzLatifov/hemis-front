export { default as apiClient } from './client'

export { login, refreshToken, logout, getCurrentUser } from './auth.api'

export { getDashboardStats, dashboardApi } from './dashboard.api'

export {
  facultiesApi,
  type FacultyGroupRow,
  type FacultyRow,
  type FacultyDetail,
  type FacultyDictionaries,
  type DictionaryItem,
  type PageResponse,
} from './faculties.api'

export {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  reorderFavorites,
  type UserFavorite,
} from './favorites.api'

export { getUserMenu, type MenuItem, type MenuResponse } from './menu.api'

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
  type Translation,
  type TranslationListResponse,
  type TranslationCreateRequest,
  type TranslationUpdateRequest,
  type TranslationStatistics,
} from './translations.api'

export {
  universitiesApi,
  type UniversityRow,
  type UniversityDetail,
  type UniversitiesParams,
  type Dictionary,
  type Dictionaries,
} from './universities.api'
