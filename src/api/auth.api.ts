/**
 * Authentication API - Backend Adapter
 *
 * Connects to NEW-HEMIS Spring Boot backend (Web Login)
 * Uses /api/v1/web/auth endpoints for web users
 */

import axios from 'axios'
import apiClient from './client'
import type { LoginRequest, LoginResponse, AdminUser } from '@/types/auth.types'
import i18n from '@/i18n/config'

/**
 * Backend error response structure (ResponseWrapper format)
 */
interface ErrorResponse {
  success?: boolean
  message?: string
  error?: string
  errorCode?: string
  eventId?: string
}

/**
 * Map backend user data to AdminUser
 */
function mapUser(userInfo: Record<string, unknown>, locale?: string): AdminUser {
  const user = userInfo.user as Record<string, unknown>
  return {
    id: String(user.id),
    username: String(user.username),
    email: String(user.email || ''),
    name: String(user.fullName || user.username),
    locale: (locale || String(user.locale || 'uz')) as 'uz' | 'ru' | 'en',
    active: (user.active as boolean) ?? true,
    createdAt: String(user.createdAt || new Date().toISOString()),
  }
}

/**
 * Login user - Web Login Endpoint
 *
 * Step 1: POST /api/v1/web/auth/login → Get minimal JWT (in HTTPOnly cookies)
 * Step 2: GET /api/v1/web/auth/me → Get user info + permissions
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    // Step 1: Get JWT tokens (in HTTPOnly cookies)
    await apiClient.post('/api/v1/web/auth/login', {
      username: credentials.username,
      password: credentials.password,
    })

    // Step 2: Get user info + permissions (token sent via cookie)
    // Note: /auth/me returns UserInfoResponse directly (NOT wrapped in ResponseWrapper)
    const { data: userInfo } = await apiClient.get('/api/v1/web/auth/me')

    return {
      user: mapUser(userInfo, credentials.locale),
      university: userInfo.university || null,
      permissions: userInfo.permissions || [],
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      // Network error - backend is unreachable
      if (
        error.code === 'ERR_NETWORK' ||
        error.message === 'Network Error' ||
        !error.response ||
        (error.request && (error.request.status === 0 || error.request.readyState === 4))
      ) {
        const msg = i18n.t('Backend server is not available', {
          defaultValue: 'Backend server ishlamayapti',
        })
        error.message = msg || 'Backend server ishlamayapti'
        throw error
      }

      // Backend-driven i18n: Use backend's localized message directly
      const errorData = error.response?.data as ErrorResponse
      error.message = errorData?.message || errorData?.error || 'Login failed'
      throw error
    }

    throw error instanceof Error ? error : new Error('Login failed')
  }
}

/**
 * Refresh access token
 *
 * Backend: POST /api/v1/web/auth/refresh
 * Tokens are in HTTPOnly cookies — no need to send in body
 */
export const refreshToken = async (): Promise<LoginResponse> => {
  await apiClient.post('/api/v1/web/auth/refresh', {})

  // Get fresh user data and permissions
  // Note: /auth/me returns UserInfoResponse directly (NOT wrapped in ResponseWrapper)
  const { data: userInfo } = await apiClient.get('/api/v1/web/auth/me')

  return {
    user: mapUser(userInfo),
    university: userInfo.university || null,
    permissions: userInfo.permissions || [],
  }
}

/**
 * Logout user
 *
 * Backend: POST /api/v1/web/auth/logout
 * Clears HTTPOnly cookies on backend
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/api/v1/web/auth/logout')
  } catch {
    // Ignore errors - client-side cleanup will happen anyway
  }
}

/**
 * Get current authenticated user
 *
 * Uses /api/v1/web/auth/me (JWT minimal + permissions from backend)
 * Token is in HTTPOnly cookie
 */
export const getCurrentUser = async (): Promise<AdminUser> => {
  // Note: /auth/me returns UserInfoResponse directly (NOT wrapped in ResponseWrapper)
  const { data: userInfo } = await apiClient.get('/api/v1/web/auth/me')
  return mapUser(userInfo)
}
