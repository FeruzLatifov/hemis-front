/**
 * useMenuState Hook
 *
 * Manages sidebar menu expansion state:
 * - Tracks which menus are expanded (Set<string>)
 * - toggleSubmenu: expand/collapse a single menu
 * - Auto-expands parent menus when the current route matches a child
 *
 * Extracted from Sidebar.tsx for reusability and testability.
 */

import { useState, useEffect, useCallback } from 'react'
import type { MenuItem as BackendMenuItem } from '@/api/menu.api'

/**
 * Check if any item in tree is active (matches the given pathname)
 */
function checkActiveInTree(item: BackendMenuItem, pathname: string): boolean {
  if (item.url && (pathname === item.url || pathname.startsWith(item.url + '/'))) {
    return true
  }
  if (item.items && item.items.length > 0) {
    return item.items.some((child) => checkActiveInTree(child, pathname))
  }
  return false
}

interface UseMenuStateOptions {
  /** Root-level menu items from the backend */
  rootMenuItems: BackendMenuItem[]
  /** Current route pathname (from useLocation) */
  pathname: string
}

interface UseMenuStateReturn {
  /** Set of currently expanded menu item IDs */
  expandedMenus: Set<string>
  /** Toggle a menu item's expanded/collapsed state */
  toggleSubmenu: (itemId: string) => void
}

export function useMenuState({ rootMenuItems, pathname }: UseMenuStateOptions): UseMenuStateReturn {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  // Auto-expand parent menus that contain the current active page
  useEffect(() => {
    if (rootMenuItems.length === 0) return
    const toExpand = new Set<string>()
    for (const item of rootMenuItems) {
      if (item.items && item.items.length > 0 && checkActiveInTree(item, pathname)) {
        toExpand.add(item.id)
      }
    }
    if (toExpand.size > 0) {
      setExpandedMenus((prev) => {
        const merged = new Set(prev)
        for (const id of toExpand) merged.add(id)
        return merged.size !== prev.size ? merged : prev
      })
    }
  }, [rootMenuItems, pathname])

  const toggleSubmenu = useCallback((itemId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [])

  return { expandedMenus, toggleSubmenu }
}
