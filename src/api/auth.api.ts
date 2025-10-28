/**
 * Authentication API
 *
 * API calls for authentication endpoints
 */

import apiClient from './client';
import type { LoginRequest, LoginResponse, RefreshTokenRequest, AdminUser } from '../types/auth.types';

/**
 * Login user
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
  return data;
};

/**
 * Refresh access token
 */
export const refreshToken = async (request: RefreshTokenRequest): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/auth/refresh', request);
  return data;
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<AdminUser> => {
  const { data } = await apiClient.get<AdminUser>('/auth/me');
  return data;
};

/**
 * Validate token
 */
export const validateToken = async (): Promise<{ valid: boolean; userId: string }> => {
  const { data } = await apiClient.get<{ valid: boolean; userId: string }>('/auth/validate');
  return data;
};
