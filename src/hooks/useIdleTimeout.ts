/**
 * Idle Session Timeout Hook
 *
 * Automatically logs out users after a period of inactivity
 * SECURITY: Prevents unauthorized access to unattended sessions
 */

import { useEffect, useRef, useCallback } from 'react'
import { SECURITY_CONFIG } from '@/lib/security'

interface UseIdleTimeoutOptions {
  timeout?: number
  onIdle: () => void
  enabled?: boolean
}

/**
 * Hook to detect user inactivity and trigger logout
 *
 * @param options.timeout - Idle timeout in milliseconds (default: 30 minutes)
 * @param options.onIdle - Callback to execute when user is idle
 * @param options.enabled - Whether to enable the timeout (default: true)
 */
export function useIdleTimeout({
  timeout = SECURITY_CONFIG.IDLE_TIMEOUT_MS,
  onIdle,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (enabled) {
      timeoutRef.current = setTimeout(() => {
        onIdle()
      }, timeout)
    }
  }, [timeout, onIdle, enabled])

  useEffect(() => {
    if (!enabled) return

    // Events that indicate user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

    // Throttle activity detection to avoid performance issues
    let lastEventTime = 0
    const throttleMs = 1000 // Only process events once per second

    const handleActivity = () => {
      const now = Date.now()
      if (now - lastEventTime > throttleMs) {
        lastEventTime = now
        resetTimer()
      }
    }

    // Add listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if we've been idle too long while tab was hidden
        const idleTime = Date.now() - lastActivityRef.current
        if (idleTime >= timeout) {
          onIdle()
        } else {
          resetTimer()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Initial timer setup
    resetTimer()

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, timeout, onIdle, resetTimer])

  return {
    resetTimer,
    lastActivity: lastActivityRef.current,
  }
}
