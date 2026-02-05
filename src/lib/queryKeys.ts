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
} as const
