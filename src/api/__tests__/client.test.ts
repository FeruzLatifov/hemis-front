/**
 * Tests for API Client (src/api/client.ts)
 *
 * Strategy: Mock axios.create to return a controllable mock instance that
 * captures the interceptor callbacks registered by client.ts.  Then import
 * the real client module so its top-level code executes.  Finally, invoke
 * the captured callbacks directly to test each code path.
 *
 * This approach ensures the ACTUAL client.ts code is exercised (not a
 * re-implementation), giving us real coverage.
 */

import { type Mock } from 'vitest'
import type { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios'

// ---------------------------------------------------------------------------
// 1. Declare variables to capture interceptor callbacks
// ---------------------------------------------------------------------------
let requestFulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig
let requestRejected: (error: unknown) => Promise<never>
let responseFulfilled: (response: unknown) => unknown
let responseRejected: (error: AxiosError) => Promise<unknown>

// A callable mock that represents the apiClient instance itself (for retry)
const mockApiClientCall = vi.fn()

// The mock instance returned by axios.create
const mockAxiosInstance = Object.assign(mockApiClientCall, {
  interceptors: {
    request: {
      use: vi.fn((fulfilled: typeof requestFulfilled, rejected: typeof requestRejected) => {
        requestFulfilled = fulfilled
        requestRejected = rejected
      }),
    },
    response: {
      use: vi.fn((fulfilled: typeof responseFulfilled, rejected: typeof responseRejected) => {
        responseFulfilled = fulfilled
        responseRejected = rejected
      }),
    },
  },
  defaults: {
    headers: {
      common: {},
    },
  },
})

// ---------------------------------------------------------------------------
// 2. Mock axios BEFORE the module under test is imported
// ---------------------------------------------------------------------------
vi.mock('axios', () => {
  const actualCreate = vi.fn(() => mockAxiosInstance)
  return {
    default: {
      create: actualCreate,
      post: vi.fn(),
    },
    // Named exports that client.ts might reference at type level
    AxiosError: class AxiosError extends Error {},
  }
})

// Mock Sentry helpers
vi.mock('@/lib/sentry', () => ({
  captureError: vi.fn(),
  addBreadcrumb: vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// 3. Now import dependencies (mocks are already in place)
// ---------------------------------------------------------------------------
import axios from 'axios'
import { captureError, addBreadcrumb } from '@/lib/sentry'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// 4. Import the module under test - this executes client.ts top-level code
// ---------------------------------------------------------------------------

let apiClient: typeof import('@/api/client').default

beforeAll(async () => {
  const mod = await import('@/api/client')
  apiClient = mod.default
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeHeaders(extra: Record<string, string> = {}): AxiosHeaders {
  const h: Record<string, unknown> = {
    set: vi.fn(),
    get: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    ...extra,
  }
  return h as unknown as AxiosHeaders
}

function makeConfig(
  overrides: Partial<InternalAxiosRequestConfig> = {},
): InternalAxiosRequestConfig {
  return {
    headers: makeHeaders(),
    url: '/api/v1/web/test',
    method: 'get',
    ...overrides,
  } as InternalAxiosRequestConfig
}

interface ErrorData {
  success: false
  message: string
  errorCode?: string
  eventId?: string
}

function makeAxiosError(
  status: number,
  data: Partial<ErrorData> = {},
  configOverrides: Partial<InternalAxiosRequestConfig> & { _retry?: boolean } = {},
): AxiosError<ErrorData> {
  const config = makeConfig(configOverrides)
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed',
    config,
    response: {
      status,
      statusText: String(status),
      headers: {} as AxiosHeaders,
      config,
      data: { success: false as const, message: 'Server error', ...data },
    },
    toJSON: () => ({}),
  } as AxiosError<ErrorData>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('API Client module initialization', () => {
  it('calls axios.create with correct config', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 30000,
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('registers a request interceptor', () => {
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledTimes(1)
    expect(typeof requestFulfilled).toBe('function')
    expect(typeof requestRejected).toBe('function')
  })

  it('registers a response interceptor', () => {
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledTimes(1)
    expect(typeof responseFulfilled).toBe('function')
    expect(typeof responseRejected).toBe('function')
  })

  it('exports the axios instance as default', () => {
    expect(apiClient).toBe(mockAxiosInstance)
  })
})

// ===== Request Interceptor =====

describe('Request Interceptor - fulfilled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('sets Accept-Language to uz-UZ when locale is uz', () => {
    localStorage.setItem('locale', 'uz')
    const config = makeConfig()
    const result = requestFulfilled(config)
    expect(result.headers['Accept-Language']).toBe('uz-UZ')
  })

  it('maps oz to oz-UZ', () => {
    localStorage.setItem('locale', 'oz')
    const config = makeConfig()
    const result = requestFulfilled(config)
    expect(result.headers['Accept-Language']).toBe('oz-UZ')
  })

  it('maps ru to ru-RU', () => {
    localStorage.setItem('locale', 'ru')
    const config = makeConfig()
    const result = requestFulfilled(config)
    expect(result.headers['Accept-Language']).toBe('ru-RU')
  })

  it('maps en to en-US', () => {
    localStorage.setItem('locale', 'en')
    const config = makeConfig()
    const result = requestFulfilled(config)
    expect(result.headers['Accept-Language']).toBe('en-US')
  })

  it('defaults to uz-UZ when no locale is stored', () => {
    const config = makeConfig()
    const result = requestFulfilled(config)
    expect(result.headers['Accept-Language']).toBe('uz-UZ')
  })

  it('passes through unknown locale as-is', () => {
    localStorage.setItem('locale', 'fr')
    const config = makeConfig()
    const result = requestFulfilled(config)
    expect(result.headers['Accept-Language']).toBe('fr')
  })

  it('returns the config object', () => {
    const config = makeConfig()
    const result = requestFulfilled(config)
    expect(result).toBe(config)
  })

  it('handles config with no headers gracefully', () => {
    // Edge case: config.headers is falsy (defensive guard in source)
    const config = { url: '/test', method: 'get' } as unknown as InternalAxiosRequestConfig
    Object.defineProperty(config, 'headers', { value: undefined, writable: true })
    const result = requestFulfilled(config)
    expect(result).toBe(config)
    // Should not throw even without headers
  })
})

describe('Request Interceptor - rejected', () => {
  it('rejects with the same error', async () => {
    const err = new Error('request setup error')
    await expect(requestRejected(err)).rejects.toBe(err)
  })
})

// ===== Response Interceptor - fulfilled =====

describe('Response Interceptor - fulfilled', () => {
  it('passes the response through unchanged', () => {
    const response = { data: { ok: true }, status: 200 }
    expect(responseFulfilled(response)).toBe(response)
  })
})

// ===== Response Interceptor - 401 handling =====

describe('Response Interceptor - 401 errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips refresh for /auth/login endpoint', async () => {
    const error = makeAxiosError(401, {}, { url: '/api/v1/web/auth/login' })
    await expect(responseRejected(error)).rejects.toBe(error)
    expect(addBreadcrumb).toHaveBeenCalledTimes(1)
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('skips refresh for /auth/refresh endpoint', async () => {
    const error = makeAxiosError(401, {}, { url: '/api/v1/web/auth/refresh' })
    await expect(responseRejected(error)).rejects.toBe(error)
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('skips refresh for /auth/logout endpoint', async () => {
    const error = makeAxiosError(401, {}, { url: '/api/v1/web/auth/logout' })
    await expect(responseRejected(error)).rejects.toBe(error)
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('attempts token refresh for non-auth 401 and retries on success', async () => {
    ;(axios.post as Mock).mockResolvedValueOnce({ data: { success: true } })
    mockApiClientCall.mockResolvedValueOnce({ data: 'retried-response' })

    const error = makeAxiosError(401, {}, { url: '/api/v1/web/dashboard/stats' })
    const result = await responseRejected(error)

    // Verify refresh was called
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/web/auth/refresh'),
      {},
      { withCredentials: true },
    )

    // Verify the original request was retried via apiClient(originalRequest)
    expect(mockApiClientCall).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/v1/web/dashboard/stats',
        _retry: true,
      }),
    )

    expect(result).toEqual({ data: 'retried-response' })
  })

  it('dispatches auth:logout event when refresh fails', async () => {
    ;(axios.post as Mock).mockRejectedValueOnce(new Error('Refresh failed'))
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    const error = makeAxiosError(401, {}, { url: '/api/v1/web/dashboard/stats' })
    await expect(responseRejected(error)).rejects.toBe(error)

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent))
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent
    expect(event.type).toBe('auth:logout')

    dispatchSpy.mockRestore()
  })

  it('does not retry a second time when _retry is already set', async () => {
    const error = makeAxiosError(401, {}, {
      url: '/api/v1/web/dashboard/stats',
      _retry: true,
    } as Record<string, unknown>)
    await expect(responseRejected(error)).rejects.toBe(error)
    expect(axios.post).not.toHaveBeenCalled()
  })
})

// ===== Response Interceptor - 500 handling =====

describe('Response Interceptor - 500 errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls captureError and toast.error with eventId', async () => {
    const error = makeAxiosError(500, {
      message: 'Internal server error',
      errorCode: 'DB_ERROR',
      eventId: 'abc123def456ghi789',
    })

    await expect(responseRejected(error)).rejects.toBe(error)

    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: {
          error_code: 'DB_ERROR',
          backend_event_id: 'abc123def456ghi789',
        },
        extra: expect.objectContaining({
          url: '/api/v1/web/test',
          method: 'get',
          status: 500,
          backend_event_id: 'abc123def456ghi789',
        }),
        level: 'error',
      }),
    )

    expect(toast.error).toHaveBeenCalledWith('Internal server error', {
      description: 'Event ID: abc123def456...',
      duration: 5000,
    })
  })

  it('handles 500 without eventId or errorCode', async () => {
    const error = makeAxiosError(500, {
      message: 'Unknown error',
    })

    await expect(responseRejected(error)).rejects.toBe(error)

    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: {
          error_code: 'INTERNAL_ERROR',
          backend_event_id: 'none',
        },
      }),
    )

    expect(toast.error).toHaveBeenCalledWith('Unknown error', {
      description: undefined,
      duration: 5000,
    })
  })

  it('falls back to error.message when response.data.message is missing', async () => {
    const config = makeConfig()
    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Network timeout',
      config,
      response: {
        status: 500,
        statusText: '500',
        headers: {} as AxiosHeaders,
        config,
        data: { success: false as const, message: '' },
      },
      toJSON: () => ({}),
    } as AxiosError<ErrorData>

    // When data.message is falsy, the code falls back to error.message
    // The source: error.response?.data?.message || error.message
    await expect(responseRejected(error)).rejects.toBe(error)

    // captureError should have been called with the fallback message
    expect(captureError).toHaveBeenCalled()
  })
})

// ===== Response Interceptor - 400/404 handling =====

describe('Response Interceptor - 400/404 errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds breadcrumb for 400 errors', async () => {
    const error = makeAxiosError(400, {
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
    })

    await expect(responseRejected(error)).rejects.toBe(error)

    // First call: generic breadcrumb; second call: 400-specific breadcrumb
    expect(addBreadcrumb).toHaveBeenCalledTimes(2)
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'api',
        message: 'Client Error: 400 - Validation failed',
        level: 'warning',
      }),
    )
  })

  it('adds breadcrumb for 404 errors', async () => {
    const error = makeAxiosError(404, {
      message: 'Resource not found',
      errorCode: 'NOT_FOUND',
    })

    await expect(responseRejected(error)).rejects.toBe(error)

    expect(addBreadcrumb).toHaveBeenCalledTimes(2)
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'api',
        message: 'Client Error: 404 - Resource not found',
        level: 'warning',
      }),
    )
  })

  it('does not call captureError or toast for 400/404', async () => {
    const error = makeAxiosError(400, { message: 'Bad request' })
    await expect(responseRejected(error)).rejects.toBe(error)

    expect(captureError).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })
})

// ===== Response Interceptor - other status codes =====

describe('Response Interceptor - other errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds generic breadcrumb for any error (e.g. 403)', async () => {
    const error = makeAxiosError(403, { message: 'Forbidden' })
    await expect(responseRejected(error)).rejects.toBe(error)

    // Generic breadcrumb + security breadcrumb for 403
    expect(addBreadcrumb).toHaveBeenCalledTimes(2)
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'api',
        message: expect.stringContaining('API Error: 403'),
      }),
    )
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'security',
        message: expect.stringContaining('Access denied'),
      }),
    )
    expect(captureError).not.toHaveBeenCalled()
    // 403 shows toast.error with access denied message
    expect(toast.error).toHaveBeenCalled()
  })

  it('uses error.message as fallback when no response data message', async () => {
    const config = makeConfig()
    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Network Error',
      config,
      response: {
        status: 502,
        statusText: '502',
        headers: {} as AxiosHeaders,
        config,
        data: null,
      },
      toJSON: () => ({}),
    } as unknown as AxiosError<ErrorData>

    await expect(responseRejected(error)).rejects.toBe(error)

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('API Error: 502'),
      }),
    )
  })
})
