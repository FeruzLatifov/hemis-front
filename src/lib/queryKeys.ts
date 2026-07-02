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

  departments: {
    all: ['departments'] as const,
    groups: (filters?: Record<string, unknown>) => ['department-groups', filters] as const,
    byUniversity: (codes: string[], filters?: Record<string, unknown>) =>
      ['departments-by-university', codes, filters] as const,
    byId: (code: string) => ['departments', code] as const,
  },

  groups: {
    all: ['student-groups'] as const,
    groups: (filters?: Record<string, unknown>) => ['student-group-roots', filters] as const,
    byUniversity: (codes: string[], filters?: Record<string, unknown>) =>
      ['student-groups-by-university', codes, filters] as const,
    byId: (id: string) => ['student-groups', id] as const,
    dictionaries: ['student-groups', 'dictionaries'] as const,
  },

  diplomas: {
    all: ['diplomas'] as const,
    list: (filters?: Record<string, unknown>) => ['diplomas', 'list', filters] as const,
    byId: (id: string) => ['diplomas', id] as const,
    dictionaries: ['diplomas', 'dictionaries'] as const,
  },

  researchers: {
    all: ['researchers'] as const,
    list: (filters?: Record<string, unknown>) => ['researchers', 'list', filters] as const,
    byId: (id: string) => ['researchers', id] as const,
    dictionaries: ['researchers', 'dictionaries'] as const,
  },

  scientificProjects: {
    all: ['scientific-projects'] as const,
    list: (filters?: Record<string, unknown>) => ['scientific-projects', 'list', filters] as const,
    byId: (id: string) => ['scientific-projects', id] as const,
    dictionaries: ['scientific-projects', 'dictionaries'] as const,
  },

  publications: {
    all: ['publications'] as const,
    list: (filters?: Record<string, unknown>) => ['publications', 'list', filters] as const,
    byId: (id: string) => ['publications', id] as const,
    dictionaries: ['publications', 'dictionaries'] as const,
  },

  methodical: {
    all: ['methodical'] as const,
    list: (filters?: Record<string, unknown>) => ['methodical', 'list', filters] as const,
    byId: (id: string) => ['methodical', id] as const,
    dictionaries: ['methodical', 'dictionaries'] as const,
  },

  scholarships: {
    all: ['scholarships'] as const,
    list: (filters?: Record<string, unknown>) => ['scholarships', 'list', filters] as const,
    byId: (id: string) => ['scholarships', id] as const,
    dictionaries: ['scholarships', 'dictionaries'] as const,
  },

  certificates: {
    all: ['certificates'] as const,
    list: (filters?: Record<string, unknown>) => ['certificates', 'list', filters] as const,
    byId: (id: string) => ['certificates', id] as const,
    dictionaries: ['certificates', 'dictionaries'] as const,
  },

  attachedSpecialities: {
    all: ['attached-specialities'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['attached-specialities', 'list', filters] as const,
    byId: (id: string) => ['attached-specialities', id] as const,
    dictionaries: ['attached-specialities', 'dictionaries'] as const,
  },

  employeeJobs: {
    all: ['employee-jobs'] as const,
    list: (filters?: Record<string, unknown>) => ['employee-jobs', 'list', filters] as const,
    byId: (id: string) => ['employee-jobs', id] as const,
    dictionaries: ['employee-jobs', 'dictionaries'] as const,
  },

  universitySpecialities: {
    all: ['university-specialities'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['university-specialities', 'list', filters] as const,
    byId: (id: string) => ['university-specialities', id] as const,
    dictionaries: ['university-specialities', 'dictionaries'] as const,
  },

  dissertationDefense: {
    all: ['dissertation-defense'] as const,
    list: (filters?: Record<string, unknown>) => ['dissertation-defense', 'list', filters] as const,
    byId: (id: string) => ['dissertation-defense', id] as const,
    dictionaries: ['dissertation-defense', 'dictionaries'] as const,
  },

  intellectual: {
    all: ['intellectual'] as const,
    list: (filters?: Record<string, unknown>) => ['intellectual', 'list', filters] as const,
    byId: (id: string) => ['intellectual', id] as const,
    dictionaries: ['intellectual', 'dictionaries'] as const,
  },

  researchActivity: {
    all: ['research-activity'] as const,
    list: (filters?: Record<string, unknown>) => ['research-activity', 'list', filters] as const,
    byId: (id: string) => ['research-activity', id] as const,
    dictionaries: ['research-activity', 'dictionaries'] as const,
  },

  dashboard: {
    stats: ['dashboardStats'] as const,
  },

  reports: {
    all: ['reports'] as const,
    students: (params?: Record<string, unknown>) => ['reports', 'students', params] as const,
    institutions: (params?: Record<string, unknown>) =>
      ['reports', 'institutions', params] as const,
    scientific: (params?: Record<string, unknown>) => ['reports', 'scientific', params] as const,
    teachers: (params?: Record<string, unknown>) => ['reports', 'teachers', params] as const,
  },

  ratings: {
    all: ['ratings'] as const,
    administrative: (params?: Record<string, unknown>) =>
      ['ratings', 'administrative', params] as const,
    academic: (params?: Record<string, unknown>) => ['ratings', 'academic', params] as const,
    scientific: (params?: Record<string, unknown>) => ['ratings', 'scientific', params] as const,
    gpa: (params?: Record<string, unknown>) => ['ratings', 'gpa', params] as const,
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

  webhooks: {
    all: ['webhooks'] as const,
    list: ['webhooks', 'list'] as const,
    byId: (id: string) => ['webhooks', id] as const,
    byUniversity: (code: string) => ['webhooks', 'by-university', code] as const,
    deliveries: (id: string, filters?: Record<string, unknown>) =>
      ['webhooks', id, 'deliveries', filters] as const,
    deliveriesByEvent: (eventId: string) => ['webhooks', 'events', eventId, 'deliveries'] as const,
    dlq: (filters?: Record<string, unknown>) => ['webhooks', 'dlq', filters] as const,
    applyResults: (filters?: Record<string, unknown>) =>
      ['webhooks', 'apply-results', filters] as const,
    applyResultsByEvent: (eventId: string) =>
      ['webhooks', 'events', eventId, 'apply-results'] as const,
  },

  outbox: {
    all: ['outbox'] as const,
    list: (filters?: Record<string, unknown>) => ['outbox', 'list', filters] as const,
    byId: (id: string) => ['outbox', id] as const,
    stats: ['outbox', 'stats'] as const,
  },
} as const
