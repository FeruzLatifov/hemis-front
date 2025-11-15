/**
 * Sentry Error Tracking Configuration
 *
 * Purpose: Initialize Sentry for error tracking and performance monitoring
 *
 * Features:
 * - Error tracking with Event IDs
 * - Performance monitoring (transactions)
 * - User context tracking
 * - Breadcrumbs for debugging
 * - React Error Boundaries integration
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry
 *
 * IMPORTANT: This should be called BEFORE React renders
 * Call in main.tsx before createRoot()
 */
export function initSentry() {
  // Check if Sentry is enabled
  const enabled = import.meta.env.VITE_SENTRY_ENABLED === 'true';

  if (!enabled) {
    console.log('🔕 Sentry is disabled (VITE_SENTRY_ENABLED not set to true)');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('⚠️ Sentry DSN not configured. Set VITE_SENTRY_DSN in .env');
    return;
  }

  Sentry.init({
    // DSN from Sentry.io dashboard
    dsn,

    // Environment (production, staging, development)
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,

    // Release version for tracking
    release: import.meta.env.VITE_SENTRY_RELEASE || `hemis-front@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

    // Performance Monitoring - Traces Sample Rate (0.0 to 1.0)
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.2'),

    // Integrations
    integrations: [
      // React Router integration
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),

      // Replay integration (session recording)
      Sentry.replayIntegration({
        maskAllText: true,  // Mask all text for privacy
        blockAllMedia: true, // Block all media
      }),
    ],

    // Replay Sample Rates
    replaysSessionSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE || '0.1'),
    replaysOnErrorSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE || '1.0'),

    // Ignore specific errors
    ignoreErrors: [
      // Network errors
      'NetworkError',
      'Network request failed',
      // Browser errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Intentional navigation
      'Navigate',
      'Navigation',
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // Log to console in development
      if (import.meta.env.DEV) {
        console.error('🐛 Sentry Event:', event);
        console.error('🐛 Sentry Hint:', hint);
      }

      return event;
    },
  });

  console.log('✅ Sentry initialized:', {
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.2'),
  });
}

/**
 * Set user context for Sentry
 * Call this after user logs in
 *
 * @example
 * setUserContext({
 *   id: '123',
 *   username: 'admin',
 *   email: 'admin@hemis.uz'
 * })
 */
export function setUserContext(user: {
  id: string;
  username?: string;
  email?: string;
  [key: string]: any;
}) {
  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
  });
}

/**
 * Clear user context
 * Call this after user logs out
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Capture an error manually
 *
 * @example
 * captureError(new Error('Something went wrong'), {
 *   tags: { component: 'LoginForm' },
 *   extra: { userId: '123' }
 * })
 */
export function captureError(error: Error, context?: {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}) {
  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level,
  });
}

/**
 * Capture a message manually
 *
 * @example
 * captureMessage('User attempted invalid action', 'warning')
 */
export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 *
 * @example
 * addBreadcrumb({
 *   category: 'auth',
 *   message: 'User login attempt',
 *   level: 'info'
 * })
 */
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, any>;
}) {
  Sentry.addBreadcrumb(breadcrumb);
}

// Re-export Sentry for advanced use cases
export { Sentry };

// React Router imports (for integration)
import React from 'react';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';
