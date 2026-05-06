/**
 * useFavorites Hook - TanStack Query
 *
 * Fetches, caches, and mutates user favorites
 * Replaces imperative fetching/mutations in favoritesStore
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { CACHE } from '@/constants/cache'
import * as favoritesApi from '@/api/favorites.api'
import type { UserFavorite } from '@/api/favorites.api'

export function useFavoritesQuery(enabled = true) {
  return useQuery<UserFavorite[]>({
    queryKey: queryKeys.favorites.list,
    queryFn: ({ signal }) => favoritesApi.getUserFavorites(signal),
    enabled,
    staleTime: CACHE.SHORT,
    gcTime: CACHE.GC_DEFAULT,
  })
}

export function useAddFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: favoritesApi.addFavorite,
    onSuccess: (newFavorite) => {
      // Optimistic update: append to cached list
      queryClient.setQueryData<UserFavorite[]>(queryKeys.favorites.list, (old) =>
        old ? [...old, newFavorite] : [newFavorite],
      )
    },
  })
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: favoritesApi.removeFavorite,
    onMutate: async (menuCode) => {
      // Optimistic update: remove from cached list
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.list })
      const previous = queryClient.getQueryData<UserFavorite[]>(queryKeys.favorites.list)
      queryClient.setQueryData<UserFavorite[]>(queryKeys.favorites.list, (old) =>
        old ? old.filter((f) => f.menuCode !== menuCode) : [],
      )
      return { previous }
    },
    onError: (_err, _menuCode, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.favorites.list, context.previous)
      }
    },
  })
}
