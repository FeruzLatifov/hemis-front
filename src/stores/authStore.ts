/**
 * Authentication Store
 *
 * Zustand store for authentication state
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, LoginRequest } from '@/types/auth.types'
import * as authApi from '@/api/auth.api'

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
          } catch {
            // Token expired or invalid — logout
            await get().logout()
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        university: state.university,
        isAuthenticated: state.isAuthenticated,
        // NOTE: permissions are NOT persisted — fetched fresh on every initialize()
      }),
    },
  ),
)
