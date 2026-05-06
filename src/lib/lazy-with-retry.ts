/**
 * Lazy import with retry + Sentry capture.
 *
 * Why: dynamic chunk loads fail in two well-known scenarios that the default
 * React.lazy doesn't recover from:
 *   1) The user has a stale tab open and we just deployed — the old chunk URL
 *      no longer exists. A single page reload fetches the fresh manifest.
 *   2) Transient network blips (mobile, captive portal). One short retry
 *      usually wins.
 *
 * Strategy: try once, then on failure fire a one-off page reload (preserving
 * the URL) and surface the error to Sentry so we can monitor frequency. If
 * even that fails (offline), let React.Suspense + the route-level
 * RouteErrorBoundary render their fallback.
 */

import { lazy, type ComponentType } from 'react'
import { captureError } from './sentry'

const RELOAD_FLAG = 'hemis:lazy-reload'

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): ReturnType<typeof lazy<T>> {
  return lazy(async () => {
    try {
      const mod = await factory()
      // Successful load — clear the reload guard so a future failure can retry.
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(RELOAD_FLAG)
      }
      return mod
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        tags: { context: 'lazy-chunk-load' },
        level: 'warning',
      })

      // First failure: try a single hard reload (likely a deploy/manifest mismatch).
      // sessionStorage flag prevents an infinite reload loop if the underlying
      // problem is real (e.g., the chunk truly cannot be served).
      if (typeof window !== 'undefined') {
        const alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG)
        if (!alreadyReloaded) {
          window.sessionStorage.setItem(RELOAD_FLAG, '1')
          window.location.reload()
        }
      }

      throw error
    }
  })
}
