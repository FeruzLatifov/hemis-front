import { AxiosError, AxiosHeaders } from 'axios'
import { extractApiErrorMessage, isNetworkError, getErrorStatus } from '../error.util'

// Helper to create AxiosError-like objects
function createAxiosError(
  overrides: {
    responseData?: Record<string, unknown>
    status?: number
    message?: string
    code?: string
    noResponse?: boolean
  } = {},
): AxiosError {
  const headers = new AxiosHeaders()
  const config = { headers } as AxiosError['config']

  const error = new AxiosError(
    overrides.message || 'Request failed',
    overrides.code || 'ERR_BAD_REQUEST',
    config,
    {},
    overrides.noResponse
      ? undefined
      : {
          data: overrides.responseData ?? {},
          status: overrides.status ?? 400,
          statusText: 'Bad Request',
          headers: {},
          config: config!,
        },
  )

  return error
}

describe('extractApiErrorMessage', () => {
  it('returns backend localized message (priority 1)', () => {
    const error = createAxiosError({
      responseData: { message: 'Notogri login yoki parol' },
      status: 401,
    })
    expect(extractApiErrorMessage(error)).toBe('Notogri login yoki parol')
  })

  it('returns OAuth2 error_description (priority 2)', () => {
    const error = createAxiosError({
      responseData: { error_description: 'Token expired' },
      status: 401,
    })
    expect(extractApiErrorMessage(error)).toBe('Token expired')
  })

  it('returns nested error.message (priority 3)', () => {
    const error = createAxiosError({
      responseData: { error: { message: 'Nested error message' } },
      status: 500,
    })
    expect(extractApiErrorMessage(error)).toBe('Nested error message')
  })

  it('returns error string (priority 4)', () => {
    const error = createAxiosError({
      responseData: { error: 'Unauthorized' },
      status: 401,
    })
    expect(extractApiErrorMessage(error)).toBe('Unauthorized')
  })

  it('returns axios error message (priority 5)', () => {
    const error = createAxiosError({
      responseData: {},
      message: 'Network Error',
    })
    expect(extractApiErrorMessage(error)).toBe('Network Error')
  })

  it('returns axios error message when no response data available', () => {
    const error = createAxiosError({ noResponse: true, message: 'Request failed' })
    expect(extractApiErrorMessage(error, 'Xatolik')).toBe('Request failed')
  })

  it('returns fallback for non-axios non-error types', () => {
    expect(extractApiErrorMessage(undefined, 'Xatolik')).toBe('Xatolik')
  })

  it('returns custom fallback message', () => {
    expect(extractApiErrorMessage(null, 'Custom fallback')).toBe('Custom fallback')
  })

  it('returns default fallback for unknown error types', () => {
    expect(extractApiErrorMessage(42)).toBe('Unexpected error')
  })

  it('handles plain Error instances', () => {
    const error = new Error('Something broke')
    expect(extractApiErrorMessage(error)).toBe('Something broke')
  })

  it('handles Error with empty message using fallback', () => {
    const error = new Error('')
    expect(extractApiErrorMessage(error, 'Fallback')).toBe('Fallback')
  })

  it('prioritizes message over error_description', () => {
    const error = createAxiosError({
      responseData: {
        message: 'Backend message',
        error_description: 'OAuth description',
      },
    })
    expect(extractApiErrorMessage(error)).toBe('Backend message')
  })

  it('prioritizes error_description over nested error', () => {
    const error = createAxiosError({
      responseData: {
        error_description: 'OAuth desc',
        error: { message: 'Nested' },
      },
    })
    expect(extractApiErrorMessage(error)).toBe('OAuth desc')
  })
})

describe('isNetworkError', () => {
  it('returns true for ERR_NETWORK code', () => {
    const error = createAxiosError({ code: 'ERR_NETWORK', noResponse: true })
    expect(isNetworkError(error)).toBe(true)
  })

  it('returns true for ERR_CONNECTION_REFUSED code', () => {
    const error = createAxiosError({ code: 'ERR_CONNECTION_REFUSED', noResponse: true })
    expect(isNetworkError(error)).toBe(true)
  })

  it('returns true for "Network Error" message', () => {
    const error = createAxiosError({ message: 'Network Error', noResponse: true })
    expect(isNetworkError(error)).toBe(true)
  })

  it('returns true when response is undefined (no response)', () => {
    const error = createAxiosError({ noResponse: true })
    expect(isNetworkError(error)).toBe(true)
  })

  it('returns false for normal HTTP error with response', () => {
    const error = createAxiosError({ status: 500, responseData: { message: 'Server error' } })
    expect(isNetworkError(error)).toBe(false)
  })

  it('returns true for plain object with "Network Error" message', () => {
    const error = { message: 'Network Error' }
    expect(isNetworkError(error)).toBe(true)
  })

  it('returns false for null', () => {
    expect(isNetworkError(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isNetworkError(undefined)).toBe(false)
  })

  it('returns false for string', () => {
    expect(isNetworkError('error')).toBe(false)
  })
})

describe('getErrorStatus', () => {
  it('returns response status from axios error', () => {
    const error = createAxiosError({ status: 404 })
    expect(getErrorStatus(error)).toBe(404)
  })

  it('returns 401 for unauthorized', () => {
    const error = createAxiosError({ status: 401 })
    expect(getErrorStatus(error)).toBe(401)
  })

  it('returns fallback when no response', () => {
    const error = createAxiosError({ noResponse: true })
    expect(getErrorStatus(error)).toBe(500)
  })

  it('returns custom fallback', () => {
    const error = createAxiosError({ noResponse: true })
    expect(getErrorStatus(error, 0)).toBe(0)
  })

  it('returns fallback for non-axios error', () => {
    expect(getErrorStatus(new Error('test'))).toBe(500)
  })

  it('returns fallback for null', () => {
    expect(getErrorStatus(null, 503)).toBe(503)
  })
})
