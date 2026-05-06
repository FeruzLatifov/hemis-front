import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { captureError } from './sentry'

type AxiosLike = { response?: { status?: number; data?: { message?: string } } }

const status = (error: unknown): number | undefined => (error as AxiosLike)?.response?.status

/**
 * Cancellation/rejection guard for the cache-level handlers.
 *
 * - 4xx errors are part of normal app flow (validation, not-found, forbidden);
 *   the API client interceptor already toasts them and the UI surfaces them.
 *   Forwarding them to Sentry is noise.
 * - AbortError is fired when a query gets superseded by a fresh request or the
 *   component unmounts; never an actual error.
 */
const shouldCaptureToSentry = (error: unknown): boolean => {
  const code = status(error)
  if (code !== undefined && code >= 400 && code < 500) return false
  if (error instanceof Error && error.name === 'AbortError') return false
  if (error instanceof DOMException && error.name === 'AbortError') return false
  return true
}

/**
 * Global Query Client for TanStack Query
 *
 * Configured with best practices for HEMIS application. Cache-level
 * onError hooks forward unexpected query/mutation failures to Sentry
 * (5xx + network), while letting expected 4xx flows pass through.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!shouldCaptureToSentry(error)) return
      captureError(error instanceof Error ? error : new Error(String(error)), {
        tags: { context: 'tanstack-query', queryKey: JSON.stringify(query.queryKey).slice(0, 200) },
        level: 'error',
      })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (!shouldCaptureToSentry(error)) return
      captureError(error instanceof Error ? error : new Error(String(error)), {
        tags: {
          context: 'tanstack-mutation',
          mutationKey: mutation.options.mutationKey
            ? JSON.stringify(mutation.options.mutationKey).slice(0, 200)
            : 'anonymous',
        },
        level: 'error',
      })
    },
  }),
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache time (gcTime): Keep unused data in cache for 30 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes

      // Retry GET queries up to 2 times on transient failure (CLAUDE.md rule).
      // Skip retry for 4xx client errors — they won't recover.
      retry: (failureCount, error: unknown) => {
        const code = status(error)
        if (code && code >= 400 && code < 500) return false
        return failureCount < 2
      },

      // Don't refetch on window focus (reduces server load)
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Don't retry mutations
      retry: 0,
    },
  },
})
