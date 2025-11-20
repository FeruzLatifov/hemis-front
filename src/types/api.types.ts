/**
 * API Response Types
 * 
 * Generic types for API responses
 */

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp?: string
}

export interface ApiError {
  success: false
  message: string
  code: string
  field?: string
  details?: Record<string, unknown>
  timestamp: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface PageRequest {
  page?: number
  size?: number
  sort?: string
}

export interface SearchParams extends PageRequest {
  q?: string
  search?: string
}
