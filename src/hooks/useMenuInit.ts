/**
 * useMenuInit Hook
 *
 * Initializes menu data from backend on app startup via TanStack Query
 * Syncs data to Zustand stores for backward-compatible consumer access
 * Handles language changes and authentication state
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useMenuStore } from '@/stores/menuStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useMenu } from './useMenu'
import { useFavoritesQuery } from './useFavorites'
import { queryKeys } from '@/lib/queryKeys'
import { shortToBcp47 } from '@/i18n/config'

export const useMenuInit = () => {
  const { i18n } = useTranslation()
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const currentLang = i18n.language || 'uz'
  const bcp47Locale = shortToBcp47[currentLang] || 'uz-UZ'

  // TanStack Query: fetch menu
  const { data: menuData, isLoading, error } = useMenu(bcp47Locale, isAuthenticated)

  // TanStack Query: fetch favorites
  const { data: favoritesData } = useFavoritesQuery(isAuthenticated)

  // Sync menu data to Zustand store (backward compatibility)
  const setMenuItems = useMenuStore((state) => state.setMenuItems)
  const clearMenu = useMenuStore((state) => state.clearMenu)
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites)

  useEffect(() => {
    if (!isAuthenticated) {
      clearMenu()
      clearFavorites()
      queryClient.removeQueries({ queryKey: queryKeys.menu.all })
      queryClient.removeQueries({ queryKey: queryKeys.favorites.all })
      return
    }

    if (menuData?.menu) {
      setMenuItems(menuData.menu)
    }
  }, [isAuthenticated, menuData, setMenuItems, clearMenu, clearFavorites, queryClient])

  // Sync favorites data to Zustand store (backward compatibility)
  useEffect(() => {
    if (favoritesData) {
      useFavoritesStore.setState({ favorites: favoritesData })
    }
  }, [favoritesData])

  // Listen for language changes and invalidate menu query
  useEffect(() => {
    if (!isAuthenticated) return

    const handleLanguageChange = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all })
    }

    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [isAuthenticated, queryClient, i18n])

  return {
    isLoading,
    error: error?.message ?? null,
    hasMenu: (menuData?.menu?.length ?? 0) > 0,
  }
}
