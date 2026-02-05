/**
 * Authentication Types
 *
 * Type definitions for authentication API
 */

import type { RoleCode } from './role.types'

export interface LoginRequest {
  username: string
  password: string
  locale?: 'uz' | 'oz' | 'ru' | 'en'
}

export interface MultilingualString {
  uz: string
  ru: string
  en: string
}

export interface University {
  id: string
  code: string
  name: MultilingualString
  shortName?: MultilingualString
  tin?: string
  active: boolean
}

export interface AdminUser {
  id: string
  username: string
  email: string
  name: string
  locale: 'uz' | 'ru' | 'en'
  active: boolean
  createdAt: string
  updatedAt?: string
  roles?: RoleCode[] // User's assigned roles
}

export interface LoginResponse {
  user: AdminUser
  university: University | null // System admins might not have university
  permissions: string[] // Permission strings (e.g., "students:read")
}

export interface AuthState {
  user: AdminUser | null
  university: University | null
  permissions: string[] // Permission strings
  isAuthenticated: boolean
}
