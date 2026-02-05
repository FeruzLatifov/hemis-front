/**
 * useMenu Hook - TanStack Query
 *
 * Fetches and caches menu data from backend
 * Replaces imperative fetching in menuStore
 */

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getUserMenu, type MenuResponse } from '@/api/menu.api'

export function useMenu(locale: string, enabled = true) {
  return useQuery<MenuResponse>({
    queryKey: queryKeys.menu.tree(locale),
    queryFn: () => getUserMenu(locale),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
