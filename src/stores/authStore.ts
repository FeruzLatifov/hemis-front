/**
 * Authentication Store
 *
 * Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, LoginRequest } from '../types/auth.types';
import * as authApi from '../api/auth.api';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setLocale: (locale: 'uz' | 'ru' | 'en') => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      refreshToken: null,
      user: null,
      university: null,
      permissions: [],
      isAuthenticated: false,

      // Login action
      login: async (credentials: LoginRequest) => {
        try {
          const response = await authApi.login(credentials);

          // ✅ NO localStorage for tokens - they are in HTTPOnly cookies
          // Only save user info and permissions for UI
          localStorage.setItem('locale', credentials.locale || 'uz');

          // Update store
          set({
            token: null, // Not stored in frontend anymore
            refreshToken: null, // Not stored in frontend anymore
            user: response.user,
            university: response.university,
            permissions: response.permissions,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // ✅ NO tokens in localStorage to clear - they're in HTTPOnly cookies
          // Backend clears cookies automatically

          // Clear store
          set({
            token: null,
            refreshToken: null,
            user: null,
            university: null,
            permissions: [],
            isAuthenticated: false,
          });
        }
      },

      // Refresh token action
      refresh: async () => {
        // ✅ refreshToken is in HTTPOnly cookie - no need to check
        try {
          const response = await authApi.refreshToken();

          // ✅ New tokens are set in cookies by backend
          // Update user info and permissions from response
          set({
            token: null, // Not stored in frontend
            refreshToken: null, // Not stored in frontend
            user: response.user,
            university: response.university,
            permissions: response.permissions,
          });
        } catch (error) {
          // Refresh failed, logout
          get().logout();
          throw error;
        }
      },

      // Set locale
      setLocale: (locale: 'uz' | 'ru' | 'en') => {
        localStorage.setItem('locale', locale);
        if (get().user) {
          set((state) => ({
            user: state.user ? { ...state.user, locale } : null,
          }));
        }
      },

      // Initialize from localStorage
      initialize: async () => {
        // Zustand persist middleware already restored the state from localStorage
        const currentState = get();
        const { isAuthenticated } = currentState;

        if (isAuthenticated) {
          // ✅ Token is in HTTPOnly cookie - browser manages expiration
          // Just check if we have user data

          // Optional: Load fresh user data in background (non-blocking)
          if (!currentState.user) {
            try {
              const user = await authApi.getCurrentUser();
              set({ user });
            } catch (error) {
              // Token might be expired - logout
              console.debug('Could not load user during initialization:', error);
              await get().logout();
            }
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        university: state.university,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
