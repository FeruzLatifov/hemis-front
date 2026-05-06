/**
 * Dashboard smoke test — single VU, full auth flow + 4 reads.
 *
 * Pass criteria:
 *   - All checks succeed
 *   - p95 latency stays under the per-endpoint SLOs (see README)
 *   - http_req_failed < 1%
 *
 * Anti-patterns avoided:
 *   - No long sleeps inside iterations — VUs idle is wasted
 *   - No login per iteration — rate-limited; we keep one cookie jar
 *     and reuse the session like a real admin user would
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'

// ─── Config ───────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081'
const USERNAME = __ENV.USERNAME || 'admin'
const PASSWORD = __ENV.PASSWORD || 'admin123'

// Per-endpoint trends (visible in summary + Grafana k6 dashboards).
const dashboardTrend = new Trend('dashboard_stats_ms', true)
const universitiesTrend = new Trend('universities_list_ms', true)
const dictionariesTrend = new Trend('dictionaries_ms', true)
const menuTrend = new Trend('menu_ms', true)
const errorRate = new Rate('functional_errors')

export const options = {
  // Ramp-up smoke: 1 VU for 30s. Goal is "does it work", not stress.
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
    dashboard_stats_ms: ['p(95)<500'],
    universities_list_ms: ['p(95)<800'],
    dictionaries_ms: ['p(95)<200'],
    menu_ms: ['p(95)<300'],
    functional_errors: ['rate<0.01'],
  },
}

// ─── Setup: log in once, share the cookie jar across iterations ───
export function setup() {
  const jar = http.cookieJar()
  const loginRes = http.post(
    `${BASE_URL}/api/v1/web/auth/login`,
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' }, jar },
  )
  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${loginRes.status} ${loginRes.body}`)
  }
  // Returning the cookies object lets the iteration handler attach it.
  return { cookies: jar.cookiesForURL(BASE_URL) }
}

// ─── Iteration ────────────────────────────────────────────────────
export default function (data) {
  const headers = { 'Accept-Language': 'uz-UZ' }
  const params = { headers, cookies: data.cookies }

  group('dashboard stats', () => {
    const r = http.get(`${BASE_URL}/api/v1/web/dashboard/stats`, params)
    dashboardTrend.add(r.timings.duration)
    const ok = check(r, {
      'dashboard 200': (res) => res.status === 200,
      'dashboard has data': (res) => res.json('data') !== null,
    })
    if (!ok) errorRate.add(1)
  })

  group('universities list', () => {
    const r = http.get(`${BASE_URL}/api/v1/web/registry/universities?page=0&size=20`, params)
    universitiesTrend.add(r.timings.duration)
    const ok = check(r, {
      'universities 200': (res) => res.status === 200,
      'universities content array': (res) => Array.isArray(res.json('data.content')),
    })
    if (!ok) errorRate.add(1)
  })

  group('dictionaries', () => {
    const r = http.get(`${BASE_URL}/api/v1/web/registry/universities/dictionaries`, params)
    dictionariesTrend.add(r.timings.duration)
    const ok = check(r, { 'dictionaries 200': (res) => res.status === 200 })
    if (!ok) errorRate.add(1)
  })

  group('menu', () => {
    const r = http.get(`${BASE_URL}/api/v1/web/menu?locale=uz-UZ`, params)
    menuTrend.add(r.timings.duration)
    const ok = check(r, { 'menu 200': (res) => res.status === 200 })
    if (!ok) errorRate.add(1)
  })

  // Brief breathing room between iterations — admin users don't hammer
  // the API; ~1 req/s per VU is realistic.
  sleep(1)
}

// ─── Teardown: explicit logout so we don't leak sessions ──────────
export function teardown(data) {
  http.post(`${BASE_URL}/api/v1/web/auth/logout`, null, {
    cookies: data.cookies,
  })
}
