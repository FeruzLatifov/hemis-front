/**
 * Authentication API - Backend Adapter
 *
 * Connects to NEW-HEMIS Spring Boot backend (Web Login)
 * Uses /api/v1/web/auth endpoints for web users
 */

import axios from 'axios';
import apiClient from './client';
import type { LoginRequest, LoginResponse, RefreshTokenRequest, AdminUser } from '../types/auth.types';
import { parseJWT, getTokenAuthorities } from '../utils/jwt.util';
import i18n from '../i18n/config';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

/**
 * Login user - Web Login Endpoint
 *
 * Backend: POST /api/v1/web/auth/login
 * Format: JSON {username, password}
 * For: Web users (hemis-front)
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    // Call new web login endpoint
    const { data } = await axios.post(
      `${BACKEND_URL}/api/v1/web/auth/login`,
      {
        username: credentials.username,
        password: credentials.password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Parse JWT token to extract user info
    const tokenPayload = parseJWT(data.accessToken);

    if (!tokenPayload) {
      throw new Error('Failed to parse access token');
    }

    // Transform backend response to frontend format
    const response: LoginResponse = {
      token: data.accessToken,
      refreshToken: data.refreshToken,
      user: {
        id: data.user?.id || tokenPayload.sub || '',
        username: data.user?.username || tokenPayload.username || credentials.username,
        email: data.user?.email || tokenPayload.email || '',
        name: data.user?.name || data.user?.fullName || tokenPayload.full_name || tokenPayload.username || '',
        locale: credentials.locale || data.user?.locale || 'uz',
        active: data.user?.active ?? true,
        createdAt: data.user?.createdAt || new Date().toISOString(),
      },
      university: data.university || null,
      permissions: data.permissions || getTokenAuthorities(data.accessToken),
    };

    return response;
  } catch (error: unknown) {
    console.error('Login failed:', error);

    // Transform error message
    if (axios.isAxiosError(error)) {
      // Network/connection issue (backend likely down)
      if (
        error.code === 'ERR_NETWORK' ||
        error.message === 'Network Error' ||
        !error.response ||
        (error.request && (error.request.status === 0 || error.request.readyState === 4))
      ) {
        const msg = i18n.t('login.errors.backendDown', { defaultValue: 'Backend server ishlamayapti' });
        throw new Error(msg);
      }
      interface ErrorResponse {
        message?: string;
        error?: string;
      }
      const errorData = error.response?.data as ErrorResponse;
      const errorMsg = errorData?.message || errorData?.error || 'Login failed';
      throw new Error(errorMsg);
    }

    throw error instanceof Error ? error : new Error('Login failed');
  }
};

/**
 * Refresh access token
 *
 * Backend: POST /api/v1/web/auth/refresh
 * Format: JSON {refreshToken}
 */
export const refreshToken = async (request: RefreshTokenRequest): Promise<LoginResponse> => {
  try {
    const { data } = await axios.post(
      `${BACKEND_URL}/api/v1/web/auth/refresh`,
      {
        refreshToken: request.refreshToken,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Parse new token
    const tokenPayload = parseJWT(data.accessToken);

    if (!tokenPayload) {
      throw new Error('Failed to parse refreshed access token');
    }

    // Transform response
    return {
      token: data.accessToken,
      refreshToken: data.refreshToken,
      user: {
        id: data.user?.id || tokenPayload.sub || '',
        username: data.user?.username || tokenPayload.username || '',
        email: data.user?.email || tokenPayload.email || '',
        name: data.user?.name || data.user?.fullName || tokenPayload.full_name || '',
        locale: data.user?.locale || 'uz',
        active: data.user?.active ?? true,
        createdAt: data.user?.createdAt || new Date().toISOString(),
      },
      university: data.university || null,
      permissions: data.permissions || getTokenAuthorities(data.accessToken),
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
 * Also clears client-side storage
 */
export const logout = async (): Promise<void> => {
  try {
    // Call backend logout endpoint (optional - JWT is stateless)
    await axios.post(
      `${BACKEND_URL}/api/v1/web/auth/logout`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }
    );
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
 * Uses existing apiClient (with token interceptor)
 */
export const getCurrentUser = async (): Promise<AdminUser> => {
  try {
    const { data } = await apiClient.get<AdminUser>('/api/users/me');
    return data;
  } catch (error) {
    // Fallback: Parse from token if API call fails
    const token = localStorage.getItem('accessToken');
    const tokenPayload = parseJWT(token);

    if (!tokenPayload) {
      throw error;
    }

    return {
      id: tokenPayload.sub || '',
      username: tokenPayload.username || '',
      email: tokenPayload.email || '',
      name: tokenPayload.full_name || tokenPayload.username || '',
      locale: 'uz',
      active: true,
      createdAt: new Date().toISOString(),
    };
  }
};
