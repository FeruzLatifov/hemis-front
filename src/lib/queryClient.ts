import { QueryClient } from '@tanstack/react-query'

/**
 * Global Query Client for TanStack Query
 * 
 * Configured with best practices for HEMIS application
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache time (gcTime): Keep unused data in cache for 30 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes

      // Retry failed requests once
      retry: 1,

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
