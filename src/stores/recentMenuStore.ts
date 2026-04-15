/**
 * Recent Menu Store - Zustand (Persisted in localStorage)
 *
 * Tracks recently visited menu pages (max 3).
 * Used by Sidebar to show "Recently visited" section.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_RECENT_ITEMS = 3

interface RecentMenuItem {
  menuId: string
  visitedAt: number
}

interface RecentMenuState {
  recentItems: RecentMenuItem[]

  addRecent: (menuId: string) => void
  clearRecent: () => void
}

export const useRecentMenuStore = create<RecentMenuState>()(
  persist(
    (set, get) => ({
      recentItems: [],

      addRecent: (menuId: string) => {
        const items = get().recentItems.filter((r) => r.menuId !== menuId)
        items.unshift({ menuId, visitedAt: Date.now() })
        set({ recentItems: items.slice(0, MAX_RECENT_ITEMS) })
      },

      clearRecent: () => set({ recentItems: [] }),
    }),
    {
      name: 'hemis-recent-menu',
    },
  ),
)

// Selectors
export const useRecentItems = () => useRecentMenuStore((state) => state.recentItems)
