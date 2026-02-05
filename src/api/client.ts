/**
 * API Client Configuration
 *
 * Axios instance with interceptors for JWT authentication
 * Includes Sentry integration for error tracking
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { captureError, addBreadcrumb } from '@/lib/sentry'
import { toast } from 'sonner'
import { env } from '@/env'

/**
 * Standard API error response structure from backend
 */
interface ApiErrorResponse {
  success: false
  message: string
  errorCode?: string
  eventId?: string
  timestamp?: string
}

// Create axios instance
const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ CRITICAL: Enable cookies (HTTPOnly)
})

// Request interceptor - Add locale header (token in HTTPOnly cookie)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // ✅ NO NEED to add Authorization header - token is in HTTPOnly cookie
    // Backend reads cookie automatically via CookieJwtAuthenticationFilter

    // Add locale to header in BCP-47 format
    const locale = localStorage.getItem('locale') || 'uz'

    // Normalize short codes to BCP-47 format for Accept-Language header
    const localeMap: Record<string, string> = {
      uz: 'uz-UZ',
      oz: 'oz-UZ',
      ru: 'ru-RU',
      en: 'en-US',
    }

    const bcp47Locale = localeMap[locale] || locale

    if (config.headers) {
      config.headers['Accept-Language'] = bcp47Locale
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor - Handle token refresh and errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // ⭐ Extract backend Event ID from error response (if exists)
    const eventId = error.response?.data?.eventId
    const errorCode = error.response?.data?.errorCode
    const errorMessage = error.response?.data?.message || error.message

    // ⭐ Add breadcrumb for Sentry
    addBreadcrumb({
      category: 'api',
      message: `API Error: ${error.response?.status} ${originalRequest.url}`,
      level: 'error',
      data: {
        url: originalRequest.url,
        method: originalRequest.method,
        status: error.response?.status,
        eventId,
        errorCode,
      },
    })

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // ⭐ Skip refresh attempt for auth endpoints (login, refresh, logout)
      // These endpoints don't need token refresh - they handle auth themselves
      const authEndpoints = ['/auth/login', '/auth/refresh', '/auth/logout']
      const isAuthEndpoint = authEndpoints.some((ep) => originalRequest.url?.includes(ep))

      if (isAuthEndpoint) {
        // Don't try to refresh for auth endpoints - just return the error
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        // ✅ Call refresh endpoint (refreshToken is in HTTPOnly cookie)
        await axios.post(
          `${env.VITE_API_URL}/api/v1/web/auth/refresh`,
          {}, // Empty body - refreshToken is in cookie
          {
            withCredentials: true, // ✅ Send cookies
          },
        )

        // ✅ New tokens are automatically set in cookies by backend
        // Backend response: { success: true, message: "..." } (no tokens in body)
        // No need to save to localStorage

        // Retry original request (token in cookie)
        return apiClient(originalRequest)
      } catch {
        // Refresh failed - logout silently
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }

        // ⭐ Return original error, not refreshError
        // This prevents "Refresh token talab qilinadi" message from being shown
        // Instead, the original 401 error message will be shown (or user redirected to login)
        return Promise.reject(error)
      }
    }

    // ⭐ Handle 500 errors (Internal Server Error)
    if (error.response?.status === 500) {
      // Capture to Sentry (frontend) if enabled
      captureError(new Error(errorMessage), {
        tags: {
          error_code: errorCode || 'INTERNAL_ERROR',
          backend_event_id: eventId || 'none',
        },
        extra: {
          url: originalRequest.url,
          method: originalRequest.method,
          status: error.response.status,
          backend_event_id: eventId,
        },
        level: 'error',
      })

      // ⭐ Backend-driven i18n: Show backend's localized error message
      // Backend returns localized message based on Accept-Language header
      const toastDescription = eventId ? `Event ID: ${eventId.substring(0, 12)}...` : undefined

      // errorMessage is already localized by backend
      toast.error(errorMessage, {
        description: toastDescription,
        duration: 5000,
      })
    }

    // ⭐ Handle 400/404 errors
    if (error.response?.status === 400 || error.response?.status === 404) {
      addBreadcrumb({
        category: 'api',
        message: `Client Error: ${error.response.status} - ${errorMessage}`,
        level: 'warning',
        data: {
          url: originalRequest.url,
          errorCode,
        },
      })
    }

    return Promise.reject(error)
  },
)

export default apiClient
