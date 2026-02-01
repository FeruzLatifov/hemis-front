/**
 * Favorites Store - Zustand
 *
 * Manages user's favorite menu items
 * NOTE: No localStorage persistence - favorites are fetched fresh from backend
 */

import { create } from 'zustand';
import * as favoritesApi from '../api/favorites.api';
import type { UserFavorite } from '../api/favorites.api';
import { extractApiErrorMessage } from '@/utils/error.util';

// =====================================================
// Types
// =====================================================

interface FavoritesState {
  // State
  favorites: UserFavorite[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFavorites: () => Promise<void>;
  addFavorite: (menuCode: string) => Promise<void>;
  removeFavorite: (menuCode: string) => Promise<void>;
  reorderFavorites: (items: { code: string; order: number }[]) => Promise<void>;
  isFavorite: (menuCode: string) => boolean;
  clearFavorites: () => void;
}

// =====================================================
// Store
// =====================================================

export const useFavoritesStore = create<FavoritesState>()(
  (set, get) => ({
    // Initial state
    favorites: [],
    isLoading: false,
    error: null,

    // Fetch favorites from backend
    fetchFavorites: async () => {
      set({ isLoading: true, error: null });
      try {
        const favorites = await favoritesApi.getUserFavorites();
        set({ favorites, isLoading: false });
      } catch (error: unknown) {
        set({
          error: extractApiErrorMessage(error, 'Failed to fetch favorites'),
          isLoading: false,
        });
      }
    },

    // Add a menu item to favorites
    addFavorite: async (menuCode: string) => {
      try {
        const favorite = await favoritesApi.addFavorite(menuCode);
        set((state) => ({ favorites: [...state.favorites, favorite] }));
      } catch (error: unknown) {
        set({
          error: extractApiErrorMessage(error, 'Failed to add favorite'),
        });
      }
    },

    // Remove a menu item from favorites
    removeFavorite: async (menuCode: string) => {
      try {
        await favoritesApi.removeFavorite(menuCode);
        set((state) => ({
          favorites: state.favorites.filter((f) => f.menuCode !== menuCode),
        }));
      } catch (error: unknown) {
        set({
          error: extractApiErrorMessage(error, 'Failed to remove favorite'),
        });
      }
    },

    // Reorder favorites
    reorderFavorites: async (items) => {
      try {
        await favoritesApi.reorderFavorites(items);
        await get().fetchFavorites();
      } catch (error: unknown) {
        set({
          error: extractApiErrorMessage(error, 'Failed to reorder favorites'),
        });
      }
    },

    // Check if a menu item is in favorites
    isFavorite: (menuCode: string) => {
      return get().favorites.some((f) => f.menuCode === menuCode);
    },

    // Clear favorites state
    clearFavorites: () => {
      set({ favorites: [], error: null });
    },
  })
);

// =====================================================
// Selectors (for performance optimization)
// =====================================================

/**
 * Get favorites list
 */
export const useFavoritesList = () => useFavoritesStore((state) => state.favorites);

/**
 * Get favorites loading state
 */
export const useFavoritesLoading = () => useFavoritesStore((state) => state.isLoading);

/**
 * Get favorites error
 */
export const useFavoritesError = () => useFavoritesStore((state) => state.error);
