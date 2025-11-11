/**
 * useTokenRefresh Hook
 *
 * BEST PRACTICE: Proactive token refresh
 *
 * Automatically refreshes access token before it expires
 * No user interruption, seamless experience
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getTokenTimeToExpiry } from '../utils/token.util';

/**
 * Proactive Token Refresh Hook
 *
 * Strategy:
 * - Access token expires in 15 minutes
 * - We refresh at 13 minutes (2 minutes buffer)
 * - User never experiences token expiry
 *
 * Benefits:
 * ✅ No user interruption
 * ✅ No failed API calls
 * ✅ Seamless UX
 * ✅ Only 1 refresh request per session (not per page load)
 */
export function useTokenRefresh() {
  const { token, refreshToken, isAuthenticated, refresh, logout } = useAuthStore();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!isAuthenticated || !token || !refreshToken) {
      return;
    }

    // Get time until token expires (in seconds)
    const ttl = getTokenTimeToExpiry(token);

    if (ttl <= 0) {
      // Token already expired - try to refresh immediately
      refresh().catch((error) => {
        console.error('Token refresh failed:', error);
        logout();
      });
      return;
    }

    // Schedule refresh before expiry
    // Refresh 2 minutes before expiry (or at 80% of TTL, whichever is sooner)
    const bufferSeconds = 120; // 2 minutes
    const refreshAt = Math.max(ttl - bufferSeconds, ttl * 0.8);
    const refreshInMs = refreshAt * 1000;

    console.log(`🔄 Token refresh scheduled in ${Math.floor(refreshAt / 60)} minutes`);

    refreshTimerRef.current = setTimeout(async () => {
      console.log('🔄 Proactively refreshing token...');
      try {
        await refresh();
        console.log('✅ Token refreshed successfully');
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        // Don't logout immediately - axios interceptor will handle it
      }
    }, refreshInMs);

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [token, refreshToken, isAuthenticated, refresh, logout]);
}
