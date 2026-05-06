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
    terrains: (districtCode: string) => ['universities', 'terrains', districtCode] as const,
    positions: ['universities', 'positions'] as const,
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

  students: {
    all: ['students'] as const,
    list: (filters?: Record<string, unknown>) => ['students', 'list', filters] as const,
    byId: (id: string) => ['students', id] as const,
    stats: (university?: string) => ['students', 'stats', university] as const,
    dictionaries: ['students', 'dictionaries'] as const,
    duplicateStats: (university?: string) => ['students', 'duplicateStats', university] as const,
    duplicates: (filters?: Record<string, unknown>) => ['students', 'duplicates', filters] as const,
    duplicateGroupDetail: (pinfl: string) => ['students', 'duplicateGroup', pinfl] as const,
    directions: (filters?: Record<string, unknown>) => ['students', 'directions', filters] as const,
    directionsSummary: ['students', 'directionsSummary'] as const,
  },

  users: {
    all: ['users'] as const,
    list: (filters?: Record<string, unknown>) => ['users', 'list', filters] as const,
    byId: (id: string) => ['users', id] as const,
    roles: ['users', 'roles'] as const,
    rolePermissions: (id: string) => ['users', 'roles', id, 'permissions'] as const,
  },

  roles: {
    all: ['roles'] as const,
    list: (filters?: Record<string, unknown>) => ['roles', 'list', filters] as const,
    byId: (id: string) => ['roles', id] as const,
    permissions: ['roles', 'permissions'] as const,
  },

  classifiers: {
    all: ['classifiers'] as const,
    categories: ['classifiers', 'categories'] as const,
    byCategory: (category: string) => ['classifiers', 'category', category] as const,
    items: (apiKey: string, filters?: Record<string, unknown>) =>
      ['classifiers', 'items', apiKey, filters] as const,
    byId: (apiKey: string, code: string) => ['classifiers', apiKey, code] as const,
  },

  universityInfo: {
    all: ['universityInfo'] as const,
    dashboard: (code: string) => ['universityInfo', 'dashboard', code] as const,
    founders: (code: string) => ['universityInfo', 'founders', code] as const,
    lifecycle: (code: string) => ['universityInfo', 'lifecycle', code] as const,
    cadastre: (code: string) => ['universityInfo', 'cadastre', code] as const,
    profile: (code: string) => ['universityInfo', 'profile', code] as const,
  },
} as const
