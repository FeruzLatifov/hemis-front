/**
 * Application Constants
 *
 * Markazlashtirilgan konstantalar.
 * Magic strings va hardcoded qiymatlarni shu yerda saqlang.
 */

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  /** Auth state (Zustand persist) */
  AUTH: 'auth-storage',

  /** User locale preference */
  LOCALE: 'locale',

  /** Theme preference */
  THEME: 'hemis-theme',

  /** Recently visited pages */
  RECENT_PAGES: 'hemis_recent_pages',

  /** Favorite pages */
  FAVORITES: 'hemis_favorites',

  /** Sidebar collapsed state */
  SIDEBAR_COLLAPSED: 'hemis_sidebar_collapsed',

  /** Table column visibility preferences */
  TABLE_COLUMNS: 'hemis_table_columns',
} as const

// ============================================================================
// Localization
// ============================================================================

export const SUPPORTED_LOCALES = ['uz', 'oz', 'ru', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'uz'

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  uz: "O'zbek",
  oz: 'Ўзбек',
  ru: 'Русский',
  en: 'English',
}

/** BCP-47 format for Accept-Language header */
export const LOCALE_BCP47: Record<SupportedLocale, string> = {
  uz: 'uz-UZ',
  oz: 'oz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
}

// ============================================================================
// Pagination
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const

// ============================================================================
// API
// ============================================================================

export const API = {
  /** Default request timeout in ms */
  TIMEOUT: 30000,

  /** API version prefix */
  VERSION: 'v1',

  /** Base path for web API */
  WEB_BASE: '/api/v1/web',

  /** Base path for legacy API */
  LEGACY_BASE: '/app/rest/v2',
} as const

// ============================================================================
// UI
// ============================================================================

export const UI = {
  /** Toast notification duration in ms */
  TOAST_DURATION: 5000,

  /** Toast error duration in ms */
  TOAST_ERROR_DURATION: 8000,

  /** Debounce delay for search inputs in ms */
  SEARCH_DEBOUNCE: 300,

  /** Animation duration in ms */
  ANIMATION_DURATION: 200,

  /** Max items to show in recent pages */
  MAX_RECENT_PAGES: 5,

  /** Max items to show in command palette */
  MAX_COMMAND_RESULTS: 10,
} as const

// ============================================================================
// Validation
// ============================================================================

export const VALIDATION = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 4,

  /** Maximum password length */
  MAX_PASSWORD_LENGTH: 128,

  /** Maximum file upload size in bytes (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  /** Maximum avatar size in bytes (2MB) */
  MAX_AVATAR_SIZE: 2 * 1024 * 1024,
} as const

// ============================================================================
// Date Formats
// ============================================================================

export const DATE_FORMATS = {
  /** Display format: 01.01.2024 */
  DISPLAY: 'dd.MM.yyyy',

  /** Display with time: 01.01.2024 14:30 */
  DISPLAY_TIME: 'dd.MM.yyyy HH:mm',

  /** API format: 2024-01-01 */
  API: 'yyyy-MM-dd',

  /** API with time: 2024-01-01T14:30:00 */
  API_TIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const

// ============================================================================
// Routes
// ============================================================================

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  UNIVERSITIES: '/institutions/universities',
  FACULTIES: '/institutions/faculties',
  DEPARTMENTS: '/institutions/departments',
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  REPORTS: '/reports',
  TRANSLATIONS: '/system/translations',
  USERS: '/system/users',
} as const

// ============================================================================
// Query Keys (for TanStack Query)
// ============================================================================

export const QUERY_KEYS = {
  AUTH: ['auth'] as const,
  USER: ['user'] as const,
  MENU: ['menu'] as const,
  FAVORITES: ['favorites'] as const,
  DASHBOARD: ['dashboard'] as const,
  UNIVERSITIES: ['universities'] as const,
  UNIVERSITY: (id: string) => ['universities', id] as const,
  FACULTIES: ['faculties'] as const,
  FACULTY: (id: string) => ['faculties', id] as const,
  TRANSLATIONS: ['translations'] as const,
  TRANSLATION: (id: string) => ['translations', id] as const,
  DICTIONARIES: {
    REGIONS: ['dictionaries', 'regions'] as const,
    DISTRICTS: ['dictionaries', 'districts'] as const,
    UNIVERSITY_TYPES: ['dictionaries', 'universityTypes'] as const,
    OWNERSHIP_TYPES: ['dictionaries', 'ownershipTypes'] as const,
    EDUCATION_TYPES: ['dictionaries', 'educationTypes'] as const,
  },
} as const
