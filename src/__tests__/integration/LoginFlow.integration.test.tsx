/**
 * Integration test: auth flow against MSW.
 *
 * Why: Unit tests on `LoginPage` and on `authApi` separately can't catch
 * the wiring between them — a missing field in the `/auth/me` response,
 * a bad URL, a Sentry side-effect that throws, or a Zustand persist
 * misconfiguration. This test exercises the *real* authStore action
 * through MSW handlers and asserts the user-visible contract.
 *
 * What is intentionally NOT tested here:
 *   - LoginPage UI layout (covered by LoginPage.test.tsx)
 *   - axios interceptor refresh logic (covered by client.test.ts)
 *
 * Pin VITE_API_URL before importing modules that read it — apiClient is
 * created at module-load time and bakes the baseURL in.
 */

vi.stubEnv('VITE_API_URL', 'http://localhost:8081')

import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { useAuthStore } from '@/stores/authStore'

// Sentry helpers run inside login/logout — keep them silent.
vi.mock('@/lib/sentry', () => ({
  setSentryUser: vi.fn(),
  captureError: vi.fn(),
  addBreadcrumb: vi.fn(),
  Sentry: { setUser: vi.fn(), captureException: vi.fn(), addBreadcrumb: vi.fn() },
  initSentry: vi.fn(),
}))

describe('Auth flow integration (authStore + MSW)', () => {
  beforeEach(() => {
    // Each test starts from a clean slate; persist won't survive between tests
    // but reset the in-memory state explicitly to avoid order dependence.
    useAuthStore.setState({
      user: null,
      university: null,
      permissions: [],
      isAuthenticated: false,
    })
  })

  it('login() populates user/permissions and flips isAuthenticated when both backend calls succeed', async () => {
    // Override default handlers with a deterministic happy path. Use regex
    // so we match regardless of whether apiClient resolves baseURL or not.
    server.use(
      http.post(/\/api\/v1\/web\/auth\/login$/, () =>
        HttpResponse.json({ success: true }, { status: 200 }),
      ),
      // Backend returns UserInfoResponse with `user` nested (see auth.api.ts).
      http.get(/\/api\/v1\/web\/auth\/me$/, () =>
        HttpResponse.json({
          user: {
            id: 42,
            username: 'admin',
            email: 'admin@hemis.uz',
            fullName: 'Admin User',
            locale: 'uz',
            active: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
          permissions: ['VIEW_DASHBOARD', 'MANAGE_UNIVERSITIES'],
          university: { code: 'TATU', name: 'TATU' },
        }),
      ),
    )

    await useAuthStore.getState().login({
      username: 'admin',
      password: 'admin123',
      locale: 'uz',
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).not.toBeNull()
    expect(state.permissions).toEqual(['VIEW_DASHBOARD', 'MANAGE_UNIVERSITIES'])
    expect(state.university).toEqual({ code: 'TATU', name: 'TATU' })
  })

  it('login() does not flip isAuthenticated if /auth/login returns 401', async () => {
    server.use(
      http.post(/\/api\/v1\/web\/auth\/login$/, () =>
        HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 }),
      ),
    )

    await expect(
      useAuthStore.getState().login({
        username: 'wrong',
        password: 'wrong',
        locale: 'uz',
      }),
    ).rejects.toThrow()

    // Critical contract: failed login leaves no half-state behind.
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().permissions).toEqual([])
  })

  it('logout() clears the store even if the backend logout call fails', async () => {
    // First, get into an authenticated state.
    server.use(
      http.post(/\/api\/v1\/web\/auth\/login$/, () =>
        HttpResponse.json({ success: true }, { status: 200 }),
      ),
      http.get(/\/api\/v1\/web\/auth\/me$/, () =>
        HttpResponse.json({
          user: { id: 1, username: 'admin', active: true },
          permissions: ['VIEW_DASHBOARD'],
        }),
      ),
    )
    await useAuthStore.getState().login({
      username: 'admin',
      password: 'admin123',
      locale: 'uz',
    })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // Now make the logout endpoint fail. The store must STILL clear itself —
    // the local session is an authoritative source the user controls.
    server.use(http.post(/\/api\/v1\/web\/auth\/logout$/, () => HttpResponse.error()))

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().permissions).toEqual([])
  })

  it('login() broadcasts a "login" event to other tabs', async () => {
    // BroadcastChannel is a real API in jsdom; we spy via a temporary listener.
    const channel = new BroadcastChannel('hemis-auth')
    const events: { type: string }[] = []
    channel.addEventListener('message', (e) => events.push(e.data as { type: string }))

    server.use(
      http.post(/\/api\/v1\/web\/auth\/login$/, () => HttpResponse.json({ success: true })),
      http.get(/\/api\/v1\/web\/auth\/me$/, () =>
        HttpResponse.json({
          user: { id: 1, username: 'admin', active: true },
          permissions: [],
        }),
      ),
    )

    await useAuthStore.getState().login({
      username: 'admin',
      password: 'admin123',
      locale: 'uz',
    })

    // Allow the BroadcastChannel microtask to deliver.
    await new Promise((r) => setTimeout(r, 50))

    expect(events.some((e) => e.type === 'login')).toBe(true)
    channel.close()
  })
})
