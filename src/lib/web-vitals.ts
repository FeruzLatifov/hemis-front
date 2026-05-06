/**
 * Core Web Vitals → Sentry forwarding.
 *
 * Why: Sentry's auto-instrumentation captures span timings but not the
 * actual user-visible metrics (LCP, INP, CLS, FCP, TTFB). Forwarding
 * `web-vitals` results gives us field RUM data for free, attributable
 * to specific releases via the `release` tag we set in `initSentry()`.
 *
 * The library calls each callback at most once per page load (or per
 * back-forward navigation), so the volume is bounded — every event we
 * send is signal, not noise.
 *
 * The metrics also surface in the browser's PerformanceObserver, which
 * means they cost ~0 — the library just listens.
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'
import { Sentry } from './sentry'

function reportMetric(metric: Metric) {
  // Sentry "measurement" events show up on the performance dashboard and
  // are attributable to the release tag we set in initSentry().
  Sentry.setMeasurement(metric.name, metric.value, metric.name === 'CLS' ? '' : 'millisecond')

  // A breadcrumb gives us a per-event audit trail in case the user later
  // hits an error — we'll see the LCP that preceded it. Cheap and useful.
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${metric.value.toFixed(0)}${metric.name === 'CLS' ? '' : 'ms'}`,
    level: metric.rating === 'poor' ? 'warning' : 'info',
    data: {
      id: metric.id,
      navigationType: metric.navigationType,
      rating: metric.rating,
    },
  })
}

/**
 * Wire up `web-vitals` listeners. Idempotent — calling twice is a no-op
 * because the library de-duplicates per metric per page load internally.
 *
 * Call after `initSentry()` so the breadcrumbs land on a configured client.
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return

  onCLS(reportMetric)
  onFCP(reportMetric)
  onINP(reportMetric)
  onLCP(reportMetric)
  onTTFB(reportMetric)
}
