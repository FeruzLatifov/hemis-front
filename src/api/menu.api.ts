/**
 * Menu API Client
 *
 * Backend endpoints: /api/v1/web/menu
 */

import apiClient from './client';

// =====================================================
// Types (Matching Backend Response)
// =====================================================

export interface MenuItem {
  id: string;
  i18nKey?: string;    // Translation key (English text, gettext model)
  label: string;       // Current locale label
  labels?: Record<string, string>; // All locale labels {"uz-UZ": "...", "ru-RU": "..."}
  labelUz: string;     // Uzbek Latin label (always present)
  labelOz: string;     // Uzbek Cyrillic label (always present)
  labelRu: string;     // Russian label (always present)
  labelEn: string;     // English label (always present)
  url?: string;
  icon?: string;
  permission?: string;
  active?: boolean;
  visible?: boolean;   // Frontend compatibility
  order?: number;
  orderNum?: number;   // Frontend compatibility
  items?: MenuItem[];  // Children menu items
}

export interface MenuResponse {
  menu: MenuItem[];
  permissions: string[];
  locale: string;
  _meta?: {
    cached: boolean;
    cacheExpiresAt: number;
    generatedAt: string;
  };
}

export interface CheckAccessRequest {
  path: string;
}

export interface CheckAccessResponse {
  accessible: boolean;
}

export interface ClearCacheResponse {
  success: boolean;
  message: string;
}

// =====================================================
// Public API (All Authenticated Users)
// =====================================================

/**
 * Get user's menu tree (permission-filtered)
 *
 * @param locale Optional locale (default: uz-UZ)
 * @returns Full menu response with permissions
 */
export const getUserMenu = async (locale = 'uz-UZ'): Promise<MenuResponse> => {
  const response = await apiClient.get<MenuResponse>(`/api/v1/web/menu?locale=${locale}`);
  return response.data;
};

/**
 * Check if user can access a specific path
 *
 * @param path Path to check
 * @returns Whether path is accessible
 */
export const checkAccess = async (path: string): Promise<boolean> => {
  const response = await apiClient.post<CheckAccessResponse>('/api/v1/web/menu/check-access', { path });
  return response.data.accessible;
};

/**
 * Clear menu cache (admin only)
 *
 * @returns Success response
 */
export const clearCache = async (): Promise<ClearCacheResponse> => {
  const response = await apiClient.post<ClearCacheResponse>('/api/v1/web/menu/clear-cache');
  return response.data;
};

/**
 * Get full menu structure (admin only)
 *
 * @param locale Optional locale (default: uz-UZ)
 * @returns Full menu response
 */
export const getMenuStructure = async (locale = 'uz-UZ'): Promise<MenuResponse> => {
  const response = await apiClient.get<MenuResponse>(`/api/v1/web/menu/structure?locale=${locale}`);
  return response.data;
};

// =====================================================
// Helper Functions
// =====================================================

/**
 * Find menu item by URL in tree
 *
 * @param items Menu tree
 * @param url URL to find
 * @returns Menu item or undefined
 */
export const findMenuItemByUrl = (items: MenuItem[], url: string): MenuItem | undefined => {
  for (const item of items) {
    if (item.url === url) {
      return item;
    }
    if (item.items && item.items.length > 0) {
      const found = findMenuItemByUrl(item.items, url);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};

/**
 * Flatten menu tree to list
 *
 * @param items Menu tree
 * @returns Flat list of menu items
 */
export const flattenMenuTree = (items: MenuItem[]): MenuItem[] => {
  const result: MenuItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.items && item.items.length > 0) {
      result.push(...flattenMenuTree(item.items));
    }
  }
  return result;
};
