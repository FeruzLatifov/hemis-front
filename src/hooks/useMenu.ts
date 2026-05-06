/**
 * useMenu Hook - TanStack Query
 *
 * Fetches and caches menu data from backend
 * Replaces imperative fetching in menuStore
 */

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { CACHE } from '@/constants/cache'
import { getUserMenu, type MenuResponse } from '@/api/menu.api'

export function useMenu(locale: string, enabled = true) {
  return useQuery<MenuResponse>({
    queryKey: queryKeys.menu.tree(locale),
    queryFn: ({ signal }) => getUserMenu(locale, signal),
    enabled,
    staleTime: CACHE.SHORT,
    gcTime: CACHE.GC_DEFAULT,
  })
}
