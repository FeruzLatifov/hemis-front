/**
 * Skip Link Component
 *
 * Allows keyboard users to skip navigation and go directly to main content.
 * This is an important accessibility feature for screen reader and keyboard users.
 *
 * @example
 * // In your layout:
 * <SkipLink targetId="main-content" />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 */

import { useTranslation } from 'react-i18next'

interface SkipLinkProps {
  /** The ID of the element to skip to (without the #) */
  targetId?: string
  /** Custom label for the skip link */
  label?: string
}

export function SkipLink({ targetId = 'main-content', label }: SkipLinkProps) {
  const { t } = useTranslation()

  return (
    <a
      href={`#${targetId}`}
      className="fixed top-0 left-0 z-[9999] -translate-y-full transform bg-[var(--primary)] px-4 py-2 text-white transition-transform focus:translate-y-0"
      style={{
        // Only visible when focused
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.clip = 'auto'
        e.currentTarget.style.clipPath = 'none'
      }}
      onBlur={(e) => {
        e.currentTarget.style.clip = 'rect(0 0 0 0)'
        e.currentTarget.style.clipPath = 'inset(50%)'
      }}
    >
      {label || t('Skip to main content')}
    </a>
  )
}
