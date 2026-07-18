/**
 * Client-side CSV export helpers.
 *
 * Used where the data is already in memory (e.g. rendered report tables) so the
 * ministry can take an aggregation out of the system without a backend endpoint.
 */

type Cell = string | number | null | undefined

function escapeCell(value: Cell): string {
  const s = value == null ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Serialize a matrix of rows to CSV text (CRLF line endings, RFC 4180 quoting). */
export function toCsv(rows: Cell[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
}

/**
 * Trigger a browser download of the given rows as a UTF-8 CSV file.
 * The BOM makes Excel open non-ASCII (Cyrillic/Latin) text correctly.
 */
export function downloadCsv(filename: string, rows: Cell[][]): void {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
