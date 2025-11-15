/**
 * Central Type Exports
 * 
 * Barrel file for all type definitions
 */

// Auth types
export * from './auth.types'
export * from './role.types'

// API types
export * from './api.types'

// Entity types
export * from './entities.types'

// Dashboard types
export * from './dashboard.types'

// Form types
export * from './forms.types'

// Legacy types (keep for backward compatibility)
export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: T[keyof T] | undefined, row: T) => React.ReactNode
}

export interface FilterOption {
  label: string
  value: string | number
}

