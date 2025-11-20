/**
 * Query Keys for TanStack Query
 * 
 * Centralized query keys for better cache management and type safety
 * Each key is defined as a const array to ensure consistency
 */

export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
    permissions: ['auth', 'permissions'] as const,
  },

  // Universities
  universities: {
    all: ['universities'] as const,
    list: (filters?: Record<string, unknown>) => ['universities', 'list', filters] as const,
    byId: (id: number) => ['universities', id] as const,
    faculties: (id: number) => ['universities', id, 'faculties'] as const,
  },

  // Faculties
  faculties: {
    all: ['faculties'] as const,
    list: (filters?: Record<string, unknown>) => ['faculties', 'list', filters] as const,
    byId: (id: number) => ['faculties', id] as const,
    byUniversity: (universityId: number) => ['faculties', 'university', universityId] as const,
  },

  // Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    charts: ['dashboard', 'charts'] as const,
  },

  // Translations
  translations: {
    all: ['translations'] as const,
    byLanguage: (lang: string) => ['translations', lang] as const,
    byCode: (code: string) => ['translations', 'code', code] as const,
  },

  // Menu
  menu: {
    main: ['menu', 'main'] as const,
    permissions: ['menu', 'permissions'] as const,
  },

  // Students
  students: {
    all: ['students'] as const,
    list: (filters?: Record<string, unknown>) => ['students', 'list', filters] as const,
    byId: (id: number) => ['students', id] as const,
  },

  // Teachers
  teachers: {
    all: ['teachers'] as const,
    list: (filters?: Record<string, unknown>) => ['teachers', 'list', filters] as const,
    byId: (id: number) => ['teachers', id] as const,
  },
} as const
