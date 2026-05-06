import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/api/dashboard.api'
import { queryKeys } from '@/lib/queryKeys'
import { CACHE } from '@/constants/cache'

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: ({ signal }) => getDashboardStats(signal),
    staleTime: CACHE.SHORT,
    refetchInterval: CACHE.SHORT, // Auto-refresh keeps stats live on idle dashboards.
  })
}
