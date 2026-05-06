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
      // Replay is attached lazily below — adding it here would pull the
      // ~250 KB recorder into the initial Sentry chunk for every visitor,
      // even when no error ever occurs.
    ],

    // Replay Sample Rates (used by lazy-attached replay integration)
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

      // Remove sensitive data from request body (passwords, tokens)
      if (event.request?.data) {
        try {
          const data =
            typeof event.request.data === 'string'
              ? JSON.parse(event.request.data)
              : event.request.data
          const sensitiveKeys = [
            'password',
            'token',
            'secret',
            'accessToken',
            'refreshToken',
            'credit_card',
          ]
          for (const key of sensitiveKeys) {
            if (key in data) {
              data[key] = '[FILTERED]'
            }
          }
          event.request.data = typeof event.request.data === 'string' ? JSON.stringify(data) : data
        } catch {
          // If parsing fails, redact the entire body if it looks like it might contain sensitive data
          if (
            typeof event.request.data === 'string' &&
            /password|token|secret/i.test(event.request.data)
          ) {
            event.request.data = '[FILTERED]'
          }
        }
      }

      // Log to console in development
      if (import.meta.env.DEV) {
        console.error('Sentry Event:', event)
        console.error('Sentry Hint:', hint)
      }

      return event
    },
  })

  // Defer attaching the Replay integration until the browser is idle.
  // The recorder ships ~250 KB of compressed JS; loading it eagerly hits
  // every visitor on first paint. Done this way, the cost is paid only
  // after the app is interactive, and only if Sentry itself is enabled.
  if (
    typeof window !== 'undefined' &&
    parseFloat(env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE) +
      parseFloat(env.VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE) >
      0
  ) {
    const attachReplay = () => {
      const client = Sentry.getClient()
      if (!client) return
      client.addIntegration(
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      )
    }
    if ('requestIdleCallback' in window) {
      ;(window as Window & typeof globalThis).requestIdleCallback(attachReplay, { timeout: 5000 })
    } else {
      // Safari fallback: small timeout to yield to first paint.
      setTimeout(attachReplay, 2000)
    }
  }
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

/**
 * Attach the current user's identity to subsequent Sentry events.
 *
 * We pass only PII-safe identifiers (user id + username) — no email,
 * phone, or PINFL, even though the backend hands them to us. This
 * matches the principle of least exposure: Sentry breaches must not
 * leak personally identifying data.
 */
export function setSentryUser(user: { id?: string; username?: string } | null) {
  if (!user) {
    Sentry.setUser(null)
    return
  }
  Sentry.setUser({
    id: user.id,
    username: user.username,
  })
}

// Re-export Sentry for advanced use cases
export { Sentry }
