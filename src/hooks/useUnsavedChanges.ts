/**
 * Unsaved Changes Hook
 *
 * Warns users when they try to navigate away from a page with unsaved changes.
 * Handles both browser navigation (beforeunload) and React Router navigation.
 *
 * @example
 * function EditForm() {
 *   const [isDirty, setIsDirty] = useState(false)
 *
 *   useUnsavedChanges({
 *     isDirty,
 *     message: 'You have unsaved changes. Are you sure you want to leave?',
 *   })
 *
 *   return <form onChange={() => setIsDirty(true)}>...</form>
 * }
 */

import { useEffect, useCallback, useRef } from 'react'
import { useBlocker, useBeforeUnload, type BlockerFunction } from 'react-router-dom'

export interface UseUnsavedChangesOptions {
  /** Whether there are unsaved changes */
  isDirty: boolean
  /** Custom message for the confirmation dialog (browser may override this) */
  message?: string
  /** Callback when user confirms navigation */
  onConfirm?: () => void
  /** Callback when user cancels navigation */
  onCancel?: () => void
}

export interface UseUnsavedChangesReturn {
  /** Whether a navigation is being blocked */
  isBlocking: boolean
  /** Proceed with the blocked navigation */
  proceed: () => void
  /** Reset/cancel the blocked navigation */
  reset: () => void
  /** Mark form as clean (call after successful save) */
  markAsClean: () => void
}

const DEFAULT_MESSAGE = "Saqlanmagan o'zgarishlar bor. Sahifadan chiqmoqchimisiz?"

export function useUnsavedChanges({
  isDirty,
  message = DEFAULT_MESSAGE,
  onConfirm,
  onCancel,
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn {
  const isDirtyRef = useRef(isDirty)

  // Keep ref in sync
  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  // Handle browser's beforeunload event (tab close, refresh)
  useBeforeUnload(
    useCallback(
      (event) => {
        if (isDirtyRef.current) {
          event.preventDefault()
          // Modern browsers ignore custom message but still show a generic warning
          return message
        }
      },
      [message],
    ),
    { capture: true },
  )

  // Handle React Router navigation
  const blockerFn: BlockerFunction = useCallback(
    ({ currentLocation, nextLocation }) => {
      // Only block if dirty and navigating to a different path
      return isDirtyRef.current && currentLocation.pathname !== nextLocation.pathname
    },
    [], // No dependencies needed - we use ref
  )
  const blocker = useBlocker(blockerFn)

  // Handle blocker state changes
  useEffect(() => {
    if (blocker.state === 'blocked') {
      // Show confirmation dialog
      const confirmed = window.confirm(message)
      if (confirmed) {
        onConfirm?.()
        blocker.proceed()
      } else {
        onCancel?.()
        blocker.reset()
      }
    }
  }, [blocker, message, onConfirm, onCancel])

  const proceed = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }, [blocker])

  const reset = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  // markAsClean is just a semantic helper - the parent should set isDirty to false
  const markAsClean = useCallback(() => {
    isDirtyRef.current = false
  }, [])

  return {
    isBlocking: blocker.state === 'blocked',
    proceed,
    reset,
    markAsClean,
  }
}

/**
 * Simple hook for tracking form dirty state
 *
 * @example
 * const { isDirty, setDirty, setClean } = useFormDirtyState()
 *
 * useUnsavedChanges({ isDirty })
 *
 * <input onChange={() => setDirty()} />
 * <button onClick={() => { save(); setClean(); }}>Save</button>
 */
export function useFormDirtyState(initialState = false) {
  const isDirtyRef = useRef(initialState)

  const setDirty = useCallback(() => {
    isDirtyRef.current = true
  }, [])

  const setClean = useCallback(() => {
    isDirtyRef.current = false
  }, [])

  const checkDirty = useCallback(() => isDirtyRef.current, [])

  return {
    isDirty: isDirtyRef.current,
    setDirty,
    setClean,
    checkDirty,
  }
}
