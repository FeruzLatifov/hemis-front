/**
 * Authentication API - Backend Adapter
 *
 * Connects to NEW-HEMIS Spring Boot backend (Web Login)
 * Uses /api/v1/web/auth endpoints for web users
 */

import axios from 'axios';
import apiClient from './client';
import type { LoginRequest, LoginResponse, AdminUser } from '../types/auth.types';
import i18n from '../i18n/config';

/**
 * Login user - Web Login Endpoint
 *
 * ✅ BEST PRACTICE IMPLEMENTATION:
 * Step 1: POST /api/v1/web/auth/login → Get minimal JWT (only iss, sub, exp, iat)
 * Step 2: GET /api/v1/web/auth/me → Get user info + permissions
 *
 * Benefits:
 * - JWT size: ~230 bytes (minimal)
 * - Permissions from backend, NOT JWT
 * - Follows industry standards (Google, Facebook, Amazon)
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    // Step 1: Get JWT tokens (minimal) - tokens set in HTTPOnly cookies
    const { data: loginData } = await apiClient.post(
      '/api/v1/web/auth/login',
      {
        username: credentials.username,
        password: credentials.password,
      }
    );

    // Step 2: Get user info + permissions (token sent via cookie)
    const { data: userInfo } = await apiClient.get('/api/v1/web/auth/me');

    // Transform backend response to frontend format
    const response: LoginResponse = {
      // ✅ SECURITY: Tokens are null in response body (stored in HTTPOnly cookies only)
      token: loginData.accessToken || null, // Backend returns null (Fix #5)
      refreshToken: loginData.refreshToken || null, // Backend returns null (Fix #5)
      user: {
        id: userInfo.user.id,
        username: userInfo.user.username,
        email: userInfo.user.email || '',
        name: userInfo.user.fullName || userInfo.user.username,
        locale: (credentials.locale || userInfo.user.locale || 'uz') as 'uz' | 'ru' | 'en',
        active: userInfo.user.active ?? true,
        createdAt: new Date().toISOString(),
      },
      university: userInfo.university || null,
      permissions: userInfo.permissions || [],
    };

    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      // Network error - backend is unreachable (only case where we use frontend i18n)
      if (
        error.code === 'ERR_NETWORK' ||
        error.message === 'Network Error' ||
        !error.response ||
        (error.request && (error.request.status === 0 || error.request.readyState === 4))
      ) {
        const msg = i18n.t('Backend server is not available', { defaultValue: 'Backend server ishlamayapti' });
        error.message = msg || 'Backend server ishlamayapti';
        throw error;
      }

      // ⭐ Backend-driven i18n: Use backend's localized message directly
      // Backend returns localized message based on Accept-Language header
      interface ErrorResponse {
        message?: string;  // ← Localized message from backend (PRIMARY)
        error?: string;
        errorCode?: string;
        eventId?: string;
      }

      const errorData = error.response?.data as ErrorResponse;
      // Priority: backend's message field (already localized)
      error.message = errorData?.message || errorData?.error || 'Login failed';
      throw error;
    }

    throw error instanceof Error ? error : new Error('Login failed');
  }
};

/**
 * Refresh access token
 *
 * Backend: POST /api/v1/web/auth/refresh
 * ✅ refreshToken is in HTTPOnly cookie - no need to send in body
 * ✅ New tokens are also in HTTPOnly cookies (not in response body)
 */
export const refreshToken = async (): Promise<LoginResponse> => {
  try {
    const { data } = await apiClient.post(
      '/api/v1/web/auth/refresh',
      {} // Empty body - refreshToken in cookie
    );

    // Backend response: { success: true, message: "..." }
    // No user info returned, tokens are in cookies
    // We need to call /auth/me to get fresh user data
    const { data: userInfo } = await apiClient.get('/api/v1/web/auth/me');

    // Transform response
    return {
      // ✅ SECURITY: Tokens are null in response body (stored in HTTPOnly cookies only)
      token: data.accessToken || null, // Backend returns null (Fix #5)
      refreshToken: data.refreshToken || null, // Backend returns null (Fix #5)
      user: {
        id: userInfo.user.id,
        username: userInfo.user.username,
        email: userInfo.user.email || '',
        name: userInfo.user.fullName || userInfo.user.username,
        locale: userInfo.user.locale || 'uz',
        active: userInfo.user.active ?? true,
        createdAt: new Date().toISOString(),
      },
      university: userInfo.university || null,
      permissions: userInfo.permissions || [],
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user
 *
 * Backend: POST /api/v1/web/auth/logout
 * ✅ Clears HTTPOnly cookies on backend
 */
export const logout = async (): Promise<void> => {
  try {
    // Call backend logout endpoint - clears cookies
    await apiClient.post('/api/v1/web/auth/logout');
  } catch {
    // Ignore errors - client-side cleanup will happen anyway
  }

  // Clear client storage happens in authStore
  return Promise.resolve();
};

/**
 * Get current authenticated user
 *
 * NEW: Uses /api/v1/web/auth/me (JWT minimal + permissions from backend)
 * ✅ Token is in HTTPOnly cookie
 */
export const getCurrentUser = async (): Promise<AdminUser> => {
  try {
    // Call new /auth/me endpoint - token in cookie
    const { data } = await apiClient.get('/api/v1/web/auth/me');

    // Transform backend response to frontend format
    return {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email || '',
      name: data.user.fullName || data.user.username,
      locale: (data.user.locale || 'uz') as 'uz' | 'ru' | 'en',
      active: data.user.active ?? true,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    throw error;
  }
};
