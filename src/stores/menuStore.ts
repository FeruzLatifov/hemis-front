/**
 * Menu Store - Zustand
 *
 * Manages menu state and backend synchronization
 * NOTE: No localStorage persistence - menu is fetched fresh on each login
 */

import { create } from 'zustand';
import { MenuItem, getUserMenu } from '../api/menu.api';
import { extractApiErrorMessage } from '@/utils/error.util';

// =====================================================
// Types
// =====================================================

interface MenuState {
  // State
  menuItems: MenuItem[];
  permissions: string[];
  locale: string;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  version: number; // Schema version for cache invalidation

  // Actions
  fetchMenu: (locale?: string) => Promise<void>;
  setMenuItems: (items: MenuItem[]) => void;
  clearMenu: () => void;
  findMenuItem: (url: string) => MenuItem | undefined;
}

// Current menu schema version - increment when menu structure changes
const MENU_SCHEMA_VERSION = 2;

// =====================================================
// Store
// =====================================================

export const useMenuStore = create<MenuState>()(
  (set, get) => ({
    // Initial state
    menuItems: [],
    permissions: [],
    locale: 'uz-UZ',
    isLoading: false,
    error: null,
    lastFetched: null,
    version: MENU_SCHEMA_VERSION,

      // Fetch menu from backend
      fetchMenu: async (locale = 'uz-UZ') => {
        set({ isLoading: true, error: null });

        try {
          const response = await getUserMenu(locale);

          set({
            menuItems: response.menu,
            permissions: response.permissions,
            locale: response.locale,
            isLoading: false,
            lastFetched: Date.now(),
            version: MENU_SCHEMA_VERSION,
          });
        } catch (error: unknown) {
          set({
            error: extractApiErrorMessage(error, 'Failed to fetch menu'),
            isLoading: false,
          });
        }
      },

      // Set menu items manually
      setMenuItems: (items) => {
        set({ menuItems: items });
      },

      // Clear menu state
      clearMenu: () => {
        set({
          menuItems: [],
          permissions: [],
          error: null,
          lastFetched: null,
        });
      },

      // Find menu item by URL
      findMenuItem: (url) => {
        const findInTree = (items: MenuItem[], targetUrl: string): MenuItem | undefined => {
          for (const item of items) {
            if (item.url === targetUrl) {
              return item;
            }
            if (item.items && item.items.length > 0) {
              const found = findInTree(item.items, targetUrl);
              if (found) {
                return found;
              }
            }
          }
          return undefined;
        };

        return findInTree(get().menuItems, url);
      },
    })
);

// =====================================================
// Selectors (for performance optimization)
// =====================================================

/**
 * Get root menu items (top level)
 */
export const useRootMenuItems = () => useMenuStore((state) => state.menuItems);

/**
 * Get user permissions
 */
export const useUserPermissions = () => useMenuStore((state) => state.permissions);

/**
 * Get menu loading state
 */
export const useMenuLoading = () => useMenuStore((state) => state.isLoading);

/**
 * Get menu error
 */
export const useMenuError = () => useMenuStore((state) => state.error);

/**
 * Check if menu is stale (older than 1 hour)
 */
export const useIsMenuStale = () =>
  useMenuStore((state) => {
    if (!state.lastFetched) return true;
    const ONE_HOUR = 60 * 60 * 1000;
    return Date.now() - state.lastFetched > ONE_HOUR;
  });
