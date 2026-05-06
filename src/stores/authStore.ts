/**
 * Authentication Store
 *
 * Zustand store for authentication state
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthState, LoginRequest } from '@/types/auth.types'
import * as authApi from '@/api/auth.api'
import { setSentryUser } from '@/lib/sentry'
import { authBroadcaster } from '@/lib/auth-broadcast'

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setLocale: (locale: 'uz' | 'ru' | 'en') => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      university: null,
      permissions: [],
      isAuthenticated: false,

      // Login action
      login: async (credentials: LoginRequest) => {
        const response = await authApi.login(credentials)

        localStorage.setItem('locale', credentials.locale || 'uz')

        set({
          user: response.user,
          university: response.university,
          permissions: response.permissions,
          isAuthenticated: true,
        })

        // Tag subsequent Sentry events with this user (id + username only —
        // PII-safe; full profile is never sent to error monitoring).
        setSentryUser({
          id: response.user?.id ? String(response.user.id) : undefined,
          username: response.user?.username,
        })

        // Tell every other open tab to re-fetch its session so the user
        // doesn't see a stale "not logged in" UI in the next tab over.
        authBroadcaster.publish({ type: 'login' })
      },

      // Logout action
      logout: async () => {
        try {
          await authApi.logout()
        } catch {
          // Ignore logout errors
        } finally {
          set({
            user: null,
            university: null,
            permissions: [],
            isAuthenticated: false,
          })
          setSentryUser(null)
          // Force every other tab to drop its session immediately.
          // Critical on shared workstations: a logout in one tab must not
          // leave authenticated state alive in another.
          authBroadcaster.publish({ type: 'logout' })
        }
      },

      // Refresh token action
      refresh: async () => {
        try {
          const response = await authApi.refreshToken()

          set({
            user: response.user,
            university: response.university,
            permissions: response.permissions,
          })
          setSentryUser({
            id: response.user?.id ? String(response.user.id) : undefined,
            username: response.user?.username,
          })
        } catch (error) {
          get().logout()
          throw error
        }
      },

      // Set locale
      setLocale: (locale: 'uz' | 'ru' | 'en') => {
        localStorage.setItem('locale', locale)
        if (get().user) {
          set((state) => ({
            user: state.user ? { ...state.user, locale } : null,
          }))
        }
      },

      // Initialize — fetch fresh user data and permissions from backend
      initialize: async () => {
        const { isAuthenticated } = get()

        if (isAuthenticated) {
          try {
            const response = await authApi.refreshToken()
            set({
              user: response.user,
              university: response.university,
              permissions: response.permissions,
            })
            setSentryUser({
              id: response.user?.id ? String(response.user.id) : undefined,
              username: response.user?.username,
            })
          } catch {
            // Token expired or invalid — logout
            await get().logout()
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      // Use sessionStorage instead of localStorage. Two reasons:
      //   1) Reduces XSS blast radius — even with a successful injection,
      //      the leaked user metadata dies with the tab.
      //   2) Matches the actual auth boundary: the JWT lives in an
      //      HTTPOnly cookie scoped to the session anyway, so persisting
      //      user info beyond the tab serves no real product purpose.
      // Logout-on-tab-close is acceptable for an admin tool; if we ever
      // want "remember me", that goes through a backend refresh-token
      // endpoint, not localStorage.
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        university: state.university,
        isAuthenticated: state.isAuthenticated,
        // NOTE: permissions are NOT persisted — fetched fresh on every initialize()
      }),
    },
  ),
)
