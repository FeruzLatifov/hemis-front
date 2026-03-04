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
  error: string | null

  setMenuItems: (items: MenuItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearMenu: () => void
}

export const useMenuStore = create<MenuState>()((set) => ({
  menuItems: [],
  isLoading: false,
  error: null,

  setMenuItems: (items) => set({ menuItems: items, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearMenu: () => set({ menuItems: [], isLoading: false, error: null }),
}))

// Selectors
export const useRootMenuItems = () => useMenuStore((state) => state.menuItems)
export const useMenuLoading = () => useMenuStore((state) => state.isLoading)
export const useMenuError = () => useMenuStore((state) => state.error)
