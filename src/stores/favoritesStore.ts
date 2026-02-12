/**
 * Favorites Store - Zustand (Thin UI State)
 *
 * Holds favorites synced from TanStack Query via useMenuInit hook.
 * Mutations are handled by TanStack Query in useFavorites hook.
 * This store provides backward-compatible selectors and isFavorite check.
 */

import { create } from 'zustand'
import type { UserFavorite } from '@/api/favorites.api'

interface FavoritesState {
  favorites: UserFavorite[]

  isFavorite: (menuCode: string) => boolean
  clearFavorites: () => void
}

export const useFavoritesStore = create<FavoritesState>()((_set, get) => ({
  favorites: [],

  isFavorite: (menuCode: string) => {
    return get().favorites.some((f) => f.menuCode === menuCode)
  },

  clearFavorites: () => {
    useFavoritesStore.setState({ favorites: [] })
  },
}))

// Selectors
export const useFavoritesList = () => useFavoritesStore((state) => state.favorites)
