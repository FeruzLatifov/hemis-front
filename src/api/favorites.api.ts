/**
 * Favorites API Client
 *
 * Backend endpoints: /api/v1/web/favorites
 */

import apiClient from './client';

// =====================================================
// Types (Matching Backend Response)
// =====================================================

export interface UserFavorite {
  id: string;
  userId: string;
  menuCode: string;
  orderNumber: number;
  createdAt: string;
}

// =====================================================
// Public API (All Authenticated Users)
// =====================================================

/**
 * Get current user's favorite menu items
 *
 * @returns List of user favorites
 */
export const getUserFavorites = async (): Promise<UserFavorite[]> => {
  const response = await apiClient.get<UserFavorite[]>('/api/v1/web/favorites');
  return response.data;
};

/**
 * Add a menu item to favorites
 *
 * @param menuCode Menu item code to favorite
 * @returns Created favorite
 */
export const addFavorite = async (menuCode: string): Promise<UserFavorite> => {
  const response = await apiClient.post<UserFavorite>('/api/v1/web/favorites', { menuCode });
  return response.data;
};

/**
 * Remove a menu item from favorites
 *
 * @param menuCode Menu item code to unfavorite
 */
export const removeFavorite = async (menuCode: string): Promise<void> => {
  await apiClient.delete(`/api/v1/web/favorites/${menuCode}`);
};

/**
 * Reorder favorites
 *
 * @param items List of items with code and new order
 */
export const reorderFavorites = async (items: { code: string; order: number }[]): Promise<void> => {
  await apiClient.patch('/api/v1/web/favorites/reorder', items);
};
