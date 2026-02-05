/**
 * Menu Store - Zustand (Thin UI State)
 *
 * Holds menu items synced from TanStack Query via useMenuInit hook.
 * Consumers use selectors for backward compatibility.
 * Actual fetching is handled by TanStack Query in useMenu hook.
 */

import { create } from 'zustand'
import type { MenuItem } from '@/api/menu.api'

interface MenuState {
  menuItems: MenuItem[]
  isLoading: boolean

  setMenuItems: (items: MenuItem[]) => void
  setLoading: (loading: boolean) => void
  clearMenu: () => void
}

export const useMenuStore = create<MenuState>()((set) => ({
  menuItems: [],
  isLoading: false,

  setMenuItems: (items) => set({ menuItems: items }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMenu: () => set({ menuItems: [], isLoading: false }),
}))

// Selectors
export const useRootMenuItems = () => useMenuStore((state) => state.menuItems)
export const useMenuLoading = () => useMenuStore((state) => state.isLoading)
