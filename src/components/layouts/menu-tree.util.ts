/**
 * Menu tree utility — pure helpers used by sidebar menu components.
 * Kept separate from `SidebarMenuItem.tsx` so Vite Fast Refresh can detect
 * "components-only" exports in the component file.
 */

import type { MenuItem as BackendMenuItem } from '@/api/menu.api'

/**
 * Returns true if `item` itself, or any descendant, matches the current route.
 */
export function checkActiveInTree(item: BackendMenuItem, pathname: string): boolean {
  if (item.url && (pathname === item.url || pathname.startsWith(item.url + '/'))) {
    return true
  }
  if (item.items && item.items.length > 0) {
    return item.items.some((child) => checkActiveInTree(child, pathname))
  }
  return false
}
