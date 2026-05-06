/**
 * TanStack Query cache durations — single source of truth.
 *
 * Why centralised: each `staleTime: 1000 * 60 * 60` repeated across hooks
 * gradually drifts (one hook says 30 min, the next 1 hour, the next 24h).
 * One named constant per data class makes the intent explicit and lets
 * the next person tune cache aggressiveness in one place.
 *
 * The numbers are chosen to match how often the *backend* changes the
 * underlying data, not how stale the UI tolerates being:
 *   - dictionaries / classifiers : days (rarely edited)
 *   - users / roles list         : ~30 min (admin churn)
 *   - dashboard / list pages     :   5 min (user-visible movement)
 */

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

export const CACHE = {
  /** Lists, dashboards — stuff users expect to feel "live". */
  SHORT: 5 * MINUTE,
  /** Roles, users, audit summaries — back-office churn. */
  MEDIUM: 30 * MINUTE,
  /** Classifiers, dictionaries, regions — backend caches 24h, our staleTime
   *  just delays the network round-trip while the cookie is warm. */
  LONG: HOUR,
  /** Cross-session tail: keep evicted query data around in memory long
   *  enough that back-button navigation feels instant. */
  GC_DEFAULT: 30 * MINUTE,
  GC_LONG_LIVED: HOUR,
} as const
