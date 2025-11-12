/**
 * API Client Configuration
 *
 * Axios instance with interceptors for JWT authentication
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token and locale
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add access token to header
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add locale to header in BCP-47 format
    const locale = localStorage.getItem('locale') || 'uz';

    // Normalize short codes to BCP-47 format for Accept-Language header
    const localeMap: Record<string, string> = {
      'uz': 'uz-UZ',
      'oz': 'oz-UZ',
      'ru': 'ru-RU',
      'en': 'en-US'
    };

    const bcp47Locale = localeMap[locale] || locale;

    if (config.headers) {
      config.headers['Accept-Language'] = bcp47Locale;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Create form data for OAuth2 refresh grant
          const formData = new URLSearchParams();
          formData.append('grant_type', 'refresh_token');
          formData.append('refresh_token', refreshToken);

          // Call backend OAuth refresh endpoint
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/app/rest/v2/oauth/token`,
            formData,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic Y2xpZW50OnNlY3JldA==',
              },
            }
          );

          // Save new tokens (OAuth format)
          localStorage.setItem('accessToken', data.access_token);
          localStorage.setItem('refreshToken', data.refresh_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear all auth data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');

          // Emit custom event instead of direct redirect
          // ProtectedRoute will handle the redirect
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }

          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage');

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
