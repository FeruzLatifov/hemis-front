import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard.api'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => dashboardApi.getStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes - stats should be relatively fresh
  })
}

/**
 * Hook to fetch dashboard chart data (if exists)
 */
export function useDashboardCharts() {
  return useQuery({
    queryKey: queryKeys.dashboard.charts,
    queryFn: () => dashboardApi.getStats(), // Reuse stats for now
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: false, // Disable by default, enable when charts are implemented
  })
}
