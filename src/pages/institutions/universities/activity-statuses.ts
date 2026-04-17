/**
 * University activity statuses — hardcoded enum (NOT a classifier table).
 *
 * Kept in-app so `hemishe_h_university_activity_status` (CUBA legacy) can be dropped
 * once old-hemis is decommissioned. Six rarely-changing values don't warrant a DB
 * dictionary with its own API round-trip.
 *
 * `labelKey` is an i18n key (seeded in S009_seed_universities_translations.sql).
 * `event` is the matching `university_lifecycle.event_type` — used when the
 * status changes to auto-create a lifecycle event.
 */
export const ACTIVITY_STATUSES: Array<{ code: string; labelKey: string; event: string }> = [
  { code: '10', labelKey: 'Active', event: 'REACTIVATED' },
  { code: '11', labelKey: 'Closed', event: 'CLOSED' },
  { code: '12', labelKey: 'Merged', event: 'MERGED' },
  { code: '13', labelKey: 'License revoked', event: 'LICENSE_REVOKED' },
  { code: '14', labelKey: 'Suspended', event: 'SUSPENDED' },
  { code: '15', labelKey: 'Reorganized', event: 'REORGANIZED' },
]

/** Code → i18n labelKey lookup (render-time resolution). */
export const ACTIVITY_STATUS_LABEL_KEY: Record<string, string> = Object.fromEntries(
  ACTIVITY_STATUSES.map((s) => [s.code, s.labelKey]),
)

/** Code → lifecycle event type. */
export const STATUS_EVENT_MAP: Record<string, string> = Object.fromEntries(
  ACTIVITY_STATUSES.map((s) => [s.code, s.event]),
)

/** Statuses that require a successor university (merge / reorganization). */
export const NEEDS_SUCCESSOR = new Set(['12', '15'])
