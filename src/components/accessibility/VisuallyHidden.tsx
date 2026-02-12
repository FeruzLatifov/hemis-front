/**
 * Visually Hidden Component
 *
 * Hides content visually but keeps it accessible to screen readers.
 * Use this for:
 * - Icon-only buttons that need text labels
 * - Form labels that should be hidden visually
 * - Skip links and other a11y navigation
 *
 * @example
 * <button aria-label="Search">
 *   <SearchIcon />
 *   <VisuallyHidden>Search</VisuallyHidden>
 * </button>
 */

import type { ReactNode, CSSProperties } from 'react'

interface VisuallyHiddenProps {
  children: ReactNode
  /** Additional styles to apply */
  style?: CSSProperties
  /** Custom className */
  className?: string
}

const visuallyHiddenStyles: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

export function VisuallyHidden({ children, style, className }: VisuallyHiddenProps) {
  return (
    <span className={className} style={{ ...visuallyHiddenStyles, ...style }}>
      {children}
    </span>
  )
}

/**
 * Live Region Component
 *
 * Creates an ARIA live region for announcing dynamic content changes.
 * Screen readers will automatically read out content changes.
 *
 * @example
 * <LiveRegion politeness="polite">
 *   {errorMessage && <p>{errorMessage}</p>}
 * </LiveRegion>
 */
interface LiveRegionProps {
  children: ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all' | 'additions text'
  /** Hide the content visually but keep it accessible */
  visuallyHidden?: boolean
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
  visuallyHidden = false,
}: LiveRegionProps) {
  const content = (
    <div role="status" aria-live={politeness} aria-atomic={atomic} aria-relevant={relevant}>
      {children}
    </div>
  )

  if (visuallyHidden) {
    return <VisuallyHidden>{content}</VisuallyHidden>
  }

  return content
}
