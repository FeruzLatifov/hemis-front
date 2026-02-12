/**
 * Query Keys for TanStack Query
 *
 * Centralized query keys for better cache management and type safety
 * Each key is defined as a const array to ensure consistency
 */

export const queryKeys = {
  universities: {
    all: ['universities'] as const,
    list: (filters?: Record<string, unknown>) => ['universities', 'list', filters] as const,
    byId: (id: string) => ['universities', id] as const,
    faculties: (id: string) => ['universities', id, 'faculties'] as const,
    dictionaries: ['universities', 'dictionaries'] as const,
  },

  translations: {
    all: ['translations'] as const,
    list: (filters?: Record<string, unknown>) => ['translations', 'list', filters] as const,
    byId: (id: string) => ['translations', id] as const,
  },

  faculties: {
    all: ['faculties'] as const,
    groups: (filters?: Record<string, unknown>) => ['faculty-groups', filters] as const,
    byUniversity: (codes: string[], filters?: Record<string, unknown>) =>
      ['faculties-by-university', codes, filters] as const,
    byId: (code: string) => ['faculties', code] as const,
  },

  dashboard: {
    stats: ['dashboardStats'] as const,
  },

  menu: {
    all: ['menu'] as const,
    tree: (locale: string) => ['menu', 'tree', locale] as const,
  },

  favorites: {
    all: ['favorites'] as const,
    list: ['favorites', 'list'] as const,
  },

  audit: {
    all: ['audit'] as const,
    activities: (filters?: Record<string, unknown>) => ['audit', 'activities', filters] as const,
    activityDetail: (id: string) => ['audit', 'activities', id] as const,
    errors: (filters?: Record<string, unknown>) => ['audit', 'errors', filters] as const,
    errorDetail: (id: string) => ['audit', 'errors', id] as const,
    logins: (filters?: Record<string, unknown>) => ['audit', 'logins', filters] as const,
    stats: (filters?: Record<string, unknown>) => ['audit', 'stats', filters] as const,
    entityHistory: (entityType: string, entityId: string, filters?: Record<string, unknown>) =>
      ['audit', 'entityHistory', entityType, entityId, filters] as const,
  },
} as const
