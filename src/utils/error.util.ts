import axios, { type AxiosError } from 'axios'

/**
 * Backend Error Response Format (Backend-driven i18n)
 *
 * Backend returns localized error messages based on Accept-Language header.
 * Frontend should display these messages directly without additional translation.
 *
 * Example response:
 * {
 *   "status": 401,
 *   "error": "Unauthorized",
 *   "message": "Неверный логин или пароль",  ← Already translated by backend
 *   "path": "/api/v1/web/auth/login",
 *   "eventId": "abc123...",
 *   "errorCode": "AUTH_FAILED"
 * }
 */
type ApiErrorPayload = {
  message?: string // ← Localized message from backend (PRIMARY)
  error?:
    | string
    | {
        message?: string
      }
  error_description?: string // OAuth2 style error
  errorCode?: string // Error code for debugging (AUTH_FAILED, etc.)
  eventId?: string // Sentry Event ID from backend
  status?: number
  path?: string
}

type AxiosApiError = AxiosError<ApiErrorPayload>

const isAxiosApiError = (error: unknown): error is AxiosApiError =>
  axios.isAxiosError<ApiErrorPayload>(error)

/**
 * Extract error message from API response
 *
 * Priority:
 * 1. Backend localized message (message field) - PREFERRED
 * 2. OAuth2 error_description
 * 3. Nested error.message
 * 4. Axios error message
 * 5. Fallback message
 *
 * @param error - Error object (usually from catch block)
 * @param fallback - Fallback message if nothing found
 * @returns Localized error message from backend
 */
export const extractApiErrorMessage = (error: unknown, fallback = 'Unexpected error'): string => {
  if (isAxiosApiError(error)) {
    const data = error.response?.data

    // Priority 1: Backend localized message (Backend-driven i18n)
    if (data?.message) {
      return data.message
    }

    // Priority 2: OAuth2 style error_description
    if (data?.error_description) {
      return data.error_description
    }

    // Priority 3: Nested error.message
    if (typeof data?.error === 'object' && data.error?.message) {
      return data.error.message
    }

    // Priority 4: Error string
    if (typeof data?.error === 'string') {
      return data.error
    }

    // Priority 5: Axios error message
    if (error.message) {
      return error.message
    }

    return fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}

export const isNetworkError = (error: unknown): boolean => {
  if (isAxiosApiError(error)) {
    return (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ERR_CONNECTION_REFUSED' ||
      error.message === 'Network Error' ||
      typeof error.response === 'undefined'
    )
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    (error as { message?: string }).message === 'Network Error'
  ) {
    return true
  }

  return false
}

export const getErrorStatus = (error: unknown, fallback = 500): number => {
  if (isAxiosApiError(error)) {
    return error.response?.status ?? fallback
  }

  return fallback
}
