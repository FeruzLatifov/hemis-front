/**
 * Authentication Store
 *
 * Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, LoginRequest } from '../types/auth.types';
import * as authApi from '../api/auth.api';
import { isTokenExpired } from '../utils/token.util';

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

          // Save tokens to localStorage
          localStorage.setItem('accessToken', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('locale', credentials.locale || 'uz');

          // Update store
          set({
            token: response.token,
            refreshToken: response.refreshToken,
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
          // Clear tokens from localStorage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');

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
        const state = get();
        const { refreshToken } = state;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authApi.refreshToken({ refreshToken });

          // Save new tokens
          localStorage.setItem('accessToken', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);

          // Update store
          set({
            token: response.token,
            refreshToken: response.refreshToken,
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
        const { token, refreshToken, isAuthenticated } = currentState;

        if (isAuthenticated && token) {
          // ✅ BEST PRACTICE: Client-side token validation (no server call)
          // Check if access token is expired
          if (isTokenExpired(token)) {
            console.log('Access token expired, attempting refresh...');

            // Check if refresh token is also expired
            if (isTokenExpired(refreshToken, 0)) {
              // Both tokens expired - logout
              console.warn('Refresh token also expired - logging out');
              await get().logout();
              return;
            }

            // Try to refresh access token
            try {
              await get().refresh();
              console.log('Token refreshed successfully');
            } catch (error) {
              console.error('Token refresh failed during initialization:', error);
              await get().logout();
              return;
            }
          }

          // Optional: Load fresh user data in background (non-blocking)
          // Only if user not already loaded
          if (!currentState.user) {
            try {
              const user = await authApi.getCurrentUser();
              set({ user });
            } catch (error) {
              // Ignore error - user will be loaded on next successful API call
              console.debug('Could not load user during initialization:', error);
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
