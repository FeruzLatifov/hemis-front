/**
 * Authentication Types
 *
 * Type definitions for authentication API
 */

export interface LoginRequest {
  username: string;
  password: string;
  locale?: 'uz' | 'ru' | 'en';
}

export interface MultilingualString {
  uz: string;
  ru: string;
  en: string;
}

export interface University {
  id: string;
  code: string;
  name: MultilingualString;
  shortName?: MultilingualString;
  tin?: string;
  active: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  locale: 'uz' | 'ru' | 'en';
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Permission {
  entity: string;
  screen?: string;
  actions: string[];
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AdminUser;
  university: University;
  permissions: string[]; // Changed: Backend returns string array
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AdminUser | null;
  university: University | null;
  permissions: string[]; // Changed: String array for simplicity
  isAuthenticated: boolean;
}

export interface AuthError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  timestamp: string;
}
