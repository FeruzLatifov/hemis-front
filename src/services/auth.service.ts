/**
 * Authentication Service
 *
 * Business logic for authentication operations.
 * Handles login validation, session management, and permission checks.
 */

import * as authApi from '@/api/auth.api'
import type { LoginRequest, LoginResponse, AdminUser } from '@/types/auth.types'
import { STORAGE_KEYS, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/constants'

// ============================================================================
// Types
// ============================================================================

export interface AuthResult {
  success: boolean
  user: AdminUser | null
  permissions: string[]
  error?: string
}

export interface SessionStatus {
  isValid: boolean
  expiresAt?: Date
  shouldRefresh: boolean
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate login credentials before sending to API
 */
export function validateCredentials(credentials: LoginRequest): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!credentials.username?.trim()) {
    errors.push('Username majburiy')
  }

  if (!credentials.password) {
    errors.push('Parol majburiy')
  } else if (credentials.password.length < 4) {
    errors.push("Parol kamida 4 ta belgidan iborat bo'lishi kerak")
  }

  if (credentials.locale && !SUPPORTED_LOCALES.includes(credentials.locale)) {
    errors.push(`Noto'g'ri til: ${credentials.locale}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Get current locale from storage
 */
export function getCurrentLocale(): string {
  return localStorage.getItem(STORAGE_KEYS.LOCALE) || DEFAULT_LOCALE
}

/**
 * Set locale in storage
 */
export function setCurrentLocale(locale: string): void {
  if (SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) {
    localStorage.setItem(STORAGE_KEYS.LOCALE, locale)
  }
}

/**
 * Clear all auth-related storage
 */
export function clearAuthStorage(): void {
  // Note: We don't clear locale - user preference should persist
  localStorage.removeItem(STORAGE_KEYS.AUTH)
}

// ============================================================================
// API Operations
// ============================================================================

/**
 * Perform login with validation
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  // Validate before API call
  const validation = validateCredentials(credentials)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }

  // Set locale
  const locale = credentials.locale || DEFAULT_LOCALE
  setCurrentLocale(locale)

  // Call API
  return authApi.login(credentials)
}

/**
 * Perform logout
 */
export async function logout(): Promise<void> {
  try {
    await authApi.logout()
  } catch {
    // Ignore logout errors - we want to clear local state anyway
  } finally {
    clearAuthStorage()
  }
}

/**
 * Refresh session and get fresh user data
 */
export async function refreshSession(): Promise<LoginResponse> {
  return authApi.refreshToken()
}

/**
 * Get current user info from backend
 */
export async function getCurrentUser(): Promise<AdminUser> {
  return authApi.getCurrentUser()
}

// ============================================================================
// Permission Helpers
// ============================================================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(permissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some((p) => permissions.includes(p))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(permissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every((p) => permissions.includes(p))
}
