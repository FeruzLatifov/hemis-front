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

  // Visually hidden until keyboard focus reveals the link.
  // Arbitrary clip utilities replace the prior inline-style + onFocus/onBlur DOM
  // mutation, so the element stays purely declarative.
  return (
    <a
      href={`#${targetId}`}
      className="fixed top-0 left-0 z-[9999] -translate-y-full transform bg-[var(--primary)] px-4 py-2 text-white transition-transform [clip-path:inset(50%)] [clip:rect(0_0_0_0)] focus:translate-y-0 focus:[clip-path:none] focus:[clip:auto]"
    >
      {label || t('Skip to main content')}
    </a>
  )
}
