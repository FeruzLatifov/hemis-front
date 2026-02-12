/**
 * useFavorites Hook - TanStack Query
 *
 * Fetches, caches, and mutates user favorites
 * Replaces imperative fetching/mutations in favoritesStore
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import * as favoritesApi from '@/api/favorites.api'
import type { UserFavorite } from '@/api/favorites.api'

export function useFavoritesQuery(enabled = true) {
  return useQuery<UserFavorite[]>({
    queryKey: queryKeys.favorites.list,
    queryFn: favoritesApi.getUserFavorites,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
