/**
 * Authentication Store
 *
 * Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, AdminUser, University, Permission, LoginRequest } from '../types/auth.types';
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
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (token && refreshToken) {
          try {
            // Validate token
            const isValid = await authApi.validateToken();
            if (isValid.valid) {
              // Load current user
              const user = await authApi.getCurrentUser();
              set({
                token,
                refreshToken,
                user,
                isAuthenticated: true,
              });
            } else {
              // Token invalid, try refresh
              await get().refresh();
            }
          } catch (error) {
            // Authentication failed, clear state
            get().logout();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        university: state.university,
        permissions: state.permissions,
      }),
    }
  )
);
