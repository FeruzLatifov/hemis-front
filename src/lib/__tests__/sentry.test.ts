import * as Sentry from '@sentry/react'

// Mock @sentry/react
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
  reactRouterV7BrowserTracingIntegration: vi.fn().mockReturnValue({ name: 'BrowserTracing' }),
  replayIntegration: vi.fn().mockReturnValue({ name: 'Replay' }),
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
  useNavigationType: vi.fn(),
  createRoutesFromChildren: vi.fn(),
  matchRoutes: vi.fn(),
}))

// Mock @/env — each test uses vi.stubEnv to control import.meta.env,
// and sentry.ts reads from the validated `env` object. We mock @/env
// to proxy through to import.meta.env so vi.stubEnv still works.
vi.mock('@/env', () => ({
  env: new Proxy({} as Record<string, unknown>, {
    get(_target, prop: string) {
      const val = import.meta.env[prop]
      // Transform VITE_SENTRY_ENABLED like the real env.ts does
      if (prop === 'VITE_SENTRY_ENABLED') return val === 'true'
      return val ?? ''
    },
  }),
}))

// We need to control import.meta.env for each test using vi.stubEnv

describe('sentry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset env to defaults
    vi.stubEnv('VITE_SENTRY_ENABLED', '')
    vi.stubEnv('VITE_SENTRY_DSN', '')
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', '')
    vi.stubEnv('VITE_SENTRY_RELEASE', '')
    vi.stubEnv('VITE_APP_VERSION', '')
    vi.stubEnv('VITE_SENTRY_TRACES_SAMPLE_RATE', '')
    vi.stubEnv('VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE', '')
    vi.stubEnv('VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE', '')
    // Reset module cache so each test gets a fresh import
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('initSentry', () => {
    it('does nothing when VITE_SENTRY_ENABLED is not "true"', async () => {
      vi.stubEnv('VITE_SENTRY_ENABLED', 'false')
      vi.stubEnv('VITE_SENTRY_DSN', 'https://example@sentry.io/123')

      const { initSentry } = await import('@/lib/sentry')
      initSentry()

      expect(Sentry.init).not.toHaveBeenCalled()
    })

    it('does nothing when VITE_SENTRY_ENABLED is empty string', async () => {
      vi.stubEnv('VITE_SENTRY_ENABLED', '')
      vi.stubEnv('VITE_SENTRY_DSN', 'https://example@sentry.io/123')

      const { initSentry } = await import('@/lib/sentry')
      initSentry()

      expect(Sentry.init).not.toHaveBeenCalled()
    })

    it('does nothing when DSN is missing even if enabled', async () => {
      vi.stubEnv('VITE_SENTRY_ENABLED', 'true')
      vi.stubEnv('VITE_SENTRY_DSN', '')

      const { initSentry } = await import('@/lib/sentry')
      initSentry()

      expect(Sentry.init).not.toHaveBeenCalled()
    })

    it('calls Sentry.init when enabled and DSN is provided', async () => {
      vi.stubEnv('VITE_SENTRY_ENABLED', 'true')
      vi.stubEnv('VITE_SENTRY_DSN', 'https://abc123@sentry.io/456')

      const { initSentry } = await import('@/lib/sentry')
      initSentry()

      expect(Sentry.init).toHaveBeenCalledTimes(1)
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://abc123@sentry.io/456',
        }),
      )
    })

    it('passes correct configuration options to Sentry.init', async () => {
      vi.stubEnv('VITE_SENTRY_ENABLED', 'true')
      vi.stubEnv('VITE_SENTRY_DSN', 'https://abc123@sentry.io/456')
      vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'staging')
      vi.stubEnv('VITE_SENTRY_TRACES_SAMPLE_RATE', '0.5')

      const { initSentry } = await import('@/lib/sentry')
      initSentry()

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://abc123@sentry.io/456',
          environment: 'staging',
          tracesSampleRate: 0.5,
          integrations: expect.arrayContaining([
            expect.objectContaining({ name: 'BrowserTracing' }),
            expect.objectContaining({ name: 'Replay' }),
          ]),
          ignoreErrors: expect.arrayContaining(['NetworkError', 'Network request failed']),
        }),
      )
    })

    it('beforeSend removes Authorization and Cookie headers from events', async () => {
      vi.stubEnv('VITE_SENTRY_ENABLED', 'true')
      vi.stubEnv('VITE_SENTRY_DSN', 'https://abc123@sentry.io/456')

      const { initSentry } = await import('@/lib/sentry')
      initSentry()

      // Extract the beforeSend callback from the init call
      const initCall = vi.mocked(Sentry.init).mock.calls[0][0] as unknown as {
        beforeSend: (event: Record<string, unknown>, hint: unknown) => Record<string, unknown>
      }
      const beforeSend = initCall.beforeSend

      expect(beforeSend).toBeDefined()

      // Create a mock event with sensitive headers
      const event = {
        request: {
          headers: {
            Authorization: 'Bearer secret-token',
            Cookie: 'session=abc123',
            'Content-Type': 'application/json',
          },
        },
      }

      const result = beforeSend(event, {})

      // Authorization and Cookie should be removed
      expect(result.request).toBeDefined()
      const headers = (result.request as { headers: Record<string, string> }).headers
      expect(headers['Authorization']).toBeUndefined()
      expect(headers['Cookie']).toBeUndefined()
      // Other headers should remain
      expect(headers['Content-Type']).toBe('application/json')
    })
  })

  describe('captureError', () => {
    it('calls Sentry.captureException with error and context', async () => {
      const { captureError } = await import('@/lib/sentry')

      const error = new Error('Test error')
      const context = {
        tags: { component: 'LoginForm' },
        extra: { userId: '123' },
        level: 'error' as const,
      }

      captureError(error, context)

      expect(Sentry.captureException).toHaveBeenCalledTimes(1)
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: { component: 'LoginForm' },
        extra: { userId: '123' },
        level: 'error',
      })
    })

    it('calls Sentry.captureException without context when none provided', async () => {
      const { captureError } = await import('@/lib/sentry')

      const error = new Error('Simple error')
      captureError(error)

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: undefined,
        extra: undefined,
        level: undefined,
      })
    })
  })

  describe('addBreadcrumb', () => {
    it('calls Sentry.addBreadcrumb with the provided breadcrumb', async () => {
      const { addBreadcrumb } = await import('@/lib/sentry')

      const breadcrumb = {
        category: 'auth',
        message: 'User login attempt',
        level: 'info' as const,
        data: { username: 'admin' },
      }

      addBreadcrumb(breadcrumb)

      expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1)
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb)
    })
  })
})
