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
  label: string // Current locale label
  labels?: Record<string, string> // All locale labels {"uz-UZ": "...", "ru-RU": "..."}
  labelUz: string // Uzbek Latin label (always present)
  labelOz: string // Uzbek Cyrillic label (always present)
  labelRu: string // Russian label (always present)
  labelEn: string // English label (always present)
  url?: string
  icon?: string
  permission?: string
  active?: boolean
  visible?: boolean // Frontend compatibility
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
export const getUserMenu = async (locale = 'uz-UZ'): Promise<MenuResponse> => {
  const response = await apiClient.get<MenuResponse>(`/api/v1/web/menu?locale=${locale}`)
  return response.data
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
