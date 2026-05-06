import { memo } from 'react'

// ─── Search highlight helper ──────────────────────────────────────
export const HighlightText = memo(function HighlightText({
  text,
  query,
}: {
  text: string
  query: string
}) {
  if (!query || !text) return <>{text || ''}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="rounded-sm bg-yellow-100 px-0.5 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
})

// ─── Memoized cell components ─────────────────────────────────────

/** Simple text cell with dash fallback */
export const TextCell = memo(function TextCell({ value }: { value: string | undefined }) {
  return <span className="text-[var(--text-secondary)]">{value || '—'}</span>
})

/** Truncated text cell with title tooltip */
export const TruncatedTextCell = memo(function TruncatedTextCell({
  value,
}: {
  value: string | undefined
}) {
  return (
    <div className="overflow-hidden text-ellipsis text-[var(--text-secondary)]" title={value || ''}>
      {value || '—'}
    </div>
  )
})

/** Boolean status cell with dot indicator */
export const BooleanStatusCell = memo(function BooleanStatusCell({
  value,
  yesLabel,
  noLabel,
}: {
  value: boolean | undefined
  yesLabel: string
  noLabel: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${value ? 'text-emerald-600' : 'text-[var(--text-secondary)]'}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-[var(--border-color-pro)]'}`}
      />
      {value ? yesLabel : noLabel}
    </span>
  )
})

/** Active/Inactive status cell */
export const ActiveStatusCell = memo(function ActiveStatusCell({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean | undefined
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-[var(--border-color-pro)]'}`}
      />
      <span
        className={
          active ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--text-secondary)]'
        }
      >
        {active ? activeLabel : inactiveLabel}
      </span>
    </span>
  )
})

/** External link cell */
export const LinkCell = memo(function LinkCell({ url }: { url: string | undefined }) {
  if (!url) return <span className="text-[var(--text-secondary)]">—</span>
  const href = url.startsWith('http') ? url : `https://${url}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline dark:text-blue-400"
      onClick={(e) => e.stopPropagation()}
    >
      {url}
    </a>
  )
})
