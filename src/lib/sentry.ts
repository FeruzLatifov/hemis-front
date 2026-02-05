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

import * as Sentry from '@sentry/react'
import React from 'react'
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom'
import { env } from '@/env'

/**
 * Initialize Sentry
 *
 * IMPORTANT: This should be called BEFORE React renders
 * Call in main.tsx before createRoot()
 */
export function initSentry() {
  // Check if Sentry is enabled
  if (!env.VITE_SENTRY_ENABLED) {
    return
  }

  if (!env.VITE_SENTRY_DSN) {
    return
  }

  Sentry.init({
    // DSN from Sentry.io dashboard
    dsn: env.VITE_SENTRY_DSN,

    // Environment (production, staging, development)
    environment: env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,

    // Release version for tracking
    release: env.VITE_SENTRY_RELEASE || `hemis-front@${env.VITE_APP_VERSION}`,

    // Performance Monitoring - Traces Sample Rate (0.0 to 1.0)
    tracesSampleRate: parseFloat(env.VITE_SENTRY_TRACES_SAMPLE_RATE),

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
        maskAllText: true, // Mask all text for privacy
        blockAllMedia: true, // Block all media
      }),
    ],

    // Replay Sample Rates
    replaysSessionSampleRate: parseFloat(env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE),
    replaysOnErrorSampleRate: parseFloat(env.VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE),

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
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
      }

      // Log to console in development
      if (import.meta.env.DEV) {
        console.error('🐛 Sentry Event:', event)
        console.error('🐛 Sentry Hint:', hint)
      }

      return event
    },
  })
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
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  },
) {
  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level,
  })
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
  category?: string
  message: string
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  data?: Record<string, unknown>
}) {
  Sentry.addBreadcrumb(breadcrumb)
}

// Re-export Sentry for advanced use cases
export { Sentry }
