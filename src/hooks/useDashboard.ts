import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/api/dashboard.api'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })
}
