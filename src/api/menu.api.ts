/**
 * Menu API Client
 *
 * Backend endpoints: /api/v1/web/menu
 */

import apiClient from './client'

// =====================================================
// Types (Matching Backend Response)
// =====================================================

export interface MenuItem {
  id: string
  i18nKey?: string // Translation key (English text, gettext model)
  label?: string // Current locale label (fallback, prefer labels map)
  labels?: Record<string, string> // All locale labels {"uz-UZ": "...", "ru-RU": "..."}
  url?: string
  icon?: string
  permission?: string
  menuType?: 'main' | 'system' // Menu classification (default: 'main')
  active?: boolean
  visible?: boolean // Frontend compatibility (alias for active)
  order?: number
  orderNum?: number // Frontend compatibility
  items?: MenuItem[] // Children menu items
}

export interface MenuResponse {
  menu: MenuItem[]
  permissions: string[]
  locale: string
  _meta?: {
    cached: boolean
    cacheExpiresAt: number
    generatedAt: string
  }
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
export const getUserMenu = async (
  locale = 'uz-UZ',
  signal?: AbortSignal,
): Promise<MenuResponse> => {
  const response = await apiClient.get(`/api/v1/web/menu?locale=${locale}`, { signal })
  return response.data.data
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Flatten menu tree to list
 *
 * @param items Menu tree
 * @returns Flat list of menu items
 */
export const flattenMenuTree = (items: MenuItem[]): MenuItem[] => {
  const result: MenuItem[] = []
  for (const item of items) {
    result.push(item)
    if (item.items && item.items.length > 0) {
      result.push(...flattenMenuTree(item.items))
    }
  }
  return result
}
