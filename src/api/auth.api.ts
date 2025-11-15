/**
 * Authentication API - Backend Adapter
 *
 * Connects to NEW-HEMIS Spring Boot backend (Web Login)
 * Uses /api/v1/web/auth endpoints for web users
 */

import axios, { AxiosError } from 'axios';
import apiClient from './client';
import type { LoginRequest, LoginResponse, RefreshTokenRequest, AdminUser } from '../types/auth.types';
import { parseJWT, getTokenAuthorities } from '../utils/jwt.util';
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
      token: loginData.accessToken, // For backward compatibility (not stored)
      refreshToken: loginData.refreshToken, // For backward compatibility (not stored)
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
    console.error('Login failed:', error);

    if (axios.isAxiosError(error)) {
      if (
        error.code === 'ERR_NETWORK' ||
        error.message === 'Network Error' ||
        !error.response ||
        (error.request && (error.request.status === 0 || error.request.readyState === 4))
      ) {
        const msg = i18n.t('login.errors.backendDown', { defaultValue: 'Backend server ishlamayapti' });
        error.message = msg || 'Backend server ishlamayapti';
        throw error;
      }

      interface ErrorResponse {
        message?: string;
        error?: string;
      }

      const errorData = error.response?.data as ErrorResponse;
      const errorMsg = errorData?.message || errorData?.error || 'Login failed';
      error.message = errorMsg;
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
 */
export const refreshToken = async (request: RefreshTokenRequest): Promise<LoginResponse> => {
  try {
    const { data } = await apiClient.post(
      '/api/v1/web/auth/refresh',
      {} // Empty body - refreshToken in cookie
    );

    // Transform response
    return {
      token: data.accessToken,
      refreshToken: data.refreshToken,
      user: {
        id: data.user?.id || '',
        username: data.user?.username || '',
        email: data.user?.email || '',
        name: data.user?.name || data.user?.fullName || '',
        locale: data.user?.locale || 'uz',
        active: data.user?.active ?? true,
        createdAt: data.user?.createdAt || new Date().toISOString(),
      },
      university: data.university || null,
      permissions: data.permissions || [],
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
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
  } catch (error) {
    // Ignore errors - client-side cleanup will happen anyway
    console.warn('Backend logout call failed (ignored):', error);
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
    console.error('Failed to get current user:', error);
    throw error;
  }
};
