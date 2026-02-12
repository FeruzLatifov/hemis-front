/**
 * Focus Trap Hook
 *
 * Traps focus within a container element. Useful for modals and dialogs.
 * Ensures keyboard users can't tab outside of the focused area.
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const modalRef = useFocusTrap(isOpen)
 *
 *   return (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *       <input type="text" />
 *     </div>
 *   )
 * }
 */

import { useRef, useEffect, useCallback } from 'react'

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  options?: {
    /** Return focus to this element when trap is deactivated */
    returnFocusTo?: HTMLElement | null
    /** Auto-focus the first focusable element when activated */
    autoFocus?: boolean
  },
) {
  const containerRef = useRef<T>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return []
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab: Move backward
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: Move forward
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    },
    [getFocusableElements],
  )

  useEffect(() => {
    if (!isActive) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Auto-focus first focusable element
    if (options?.autoFocus !== false) {
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        // Small delay to ensure the container is rendered
        requestAnimationFrame(() => {
          focusableElements[0].focus()
        })
      }
    }

    // Add keydown listener
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Return focus to previous element
      const returnTo = options?.returnFocusTo || previousActiveElement.current
      if (returnTo && typeof returnTo.focus === 'function') {
        returnTo.focus()
      }
    }
  }, [isActive, handleKeyDown, getFocusableElements, options?.autoFocus, options?.returnFocusTo])

  return containerRef
}

/**
 * Hook to announce messages to screen readers
 *
 * @example
 * const announce = useAnnounce()
 * announce('Form submitted successfully', 'polite')
 */
export function useAnnounce() {
  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    // Find or create the live region
    let liveRegion = document.getElementById('sr-announcer')

    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'sr-announcer'
      liveRegion.setAttribute('role', 'status')
      liveRegion.setAttribute('aria-live', politeness)
      liveRegion.setAttribute('aria-atomic', 'true')
      // Visually hidden but accessible to screen readers
      Object.assign(liveRegion.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      })
      document.body.appendChild(liveRegion)
    }

    // Update politeness if different
    liveRegion.setAttribute('aria-live', politeness)

    // Clear and set message (this triggers the announcement)
    liveRegion.textContent = ''
    requestAnimationFrame(() => {
      liveRegion!.textContent = message
    })
  }, [])

  return announce
}
