import axios, { type AxiosError } from 'axios'

type ApiErrorPayload = {
  message?: string
  error?: {
    message?: string
  }
  error_description?: string
}

type AxiosApiError = AxiosError<ApiErrorPayload>

const isAxiosApiError = (error: unknown): error is AxiosApiError =>
  axios.isAxiosError<ApiErrorPayload>(error)

export const extractApiErrorMessage = (
  error: unknown,
  fallback = 'Unexpected error'
): string => {
  if (isAxiosApiError(error)) {
    return (
      error.response?.data?.error_description ||
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      fallback
    )
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
