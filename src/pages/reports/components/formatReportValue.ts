/**
 * Format a numeric report/rating measure for display.
 *
 * The shared ReportDto value is a decimal: it carries whole counts (42) as well as
 * fractional averages (GPA 3.75, score percent 87.4). A whole number renders with
 * thousands separators and NO decimals; a fractional number renders trimmed to at
 * most 2 decimals (3.75, 87.4 — not 87.40). Generic on purpose: no GPA-specific logic.
 */
export function formatReportValue(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : Number(value.toFixed(2)).toString()
}
