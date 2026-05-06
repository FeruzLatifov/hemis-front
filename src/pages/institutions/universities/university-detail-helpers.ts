/**
 * Pure (non-component) helpers for the university detail view.
 *
 * Lives in its own file so `UniversityDetailShared.tsx` can stay
 * components-only — Vite Fast Refresh warns when a file mixes
 * components with non-component exports.
 */

/**
 * Best-effort parse of a JSON array stored as a string in the backend
 * (e.g. legacy `extData` columns). Returns an empty array on bad input
 * so callers never need their own try/catch.
 */
export function parseJsonArray(raw: string | null): Array<Record<string, unknown>> {
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}
