/**
 * Sidebar Component - Backend Integration
 *
 * Dynamic menu loaded from backend API with permission filtering
 * Supports multilingual labels (uz/ru/en)
 * Features: Favorites section, system separator, command palette hint
 */

import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ChevronLeft, Menu } from 'lucide-react'
import { useRootMenuItems, useMenuLoading, useMenuError } from '@/stores/menuStore'
import { useFavoritesList } from '@/stores/favoritesStore'
import { useRecentMenuStore, useRecentItems } from '@/stores/recentMenuStore'
import { useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites'
import type { MenuItem as BackendMenuItem } from '@/api/menu.api'
import { flattenMenuTree } from '@/api/menu.api'
import { getMenuLabel } from '@/utils/menu.util'
import hemisLogo from '@/assets/images/hemis-logo-new.png'
import MenuItemComponent from './SidebarMenuItem'
import SidebarSearchBox from './SidebarSearchBox'
import SidebarFavoritesSection from './SidebarFavoritesSection'
import SidebarRecentSection from './SidebarRecentSection'
import { useMenuState } from '@/hooks/useMenuState'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation()
  const { i18n, t } = useTranslation()
  const navRef = useRef<HTMLElement>(null)

  const rootMenuItems = useRootMenuItems()
  const isLoading = useMenuLoading()
  const menuError = useMenuError()
  const favorites = useFavoritesList()
  const recentItems = useRecentItems()
  const addRecent = useRecentMenuStore((state) => state.addRecent)

  const currentLang = i18n.language || 'uz'

  // Menu expansion state (auto-expands on route change)
  const { expandedMenus, toggleSubmenu } = useMenuState({
    rootMenuItems,
    pathname: location.pathname,
  })

  // Scroll active menu item into view after menus expand
  useEffect(() => {
    if (!navRef.current || rootMenuItems.length === 0) return
    // Delay to allow expanded submenus to render
    const timer = setTimeout(() => {
      const activeEl = navRef.current?.querySelector('[data-active]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [rootMenuItems, location.pathname])

  // Close sidebar on Escape (mobile)
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && window.innerWidth < 768) {
        setOpen(false)
      }
    },
    [open, setOpen],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [handleEscape])

  // Single mutation instances for the whole sidebar
  const addFavoriteMutation = useAddFavorite()
  const removeFavoriteMutation = useRemoveFavorite()

  const handleAddFavorite = useCallback(
    (menuCode: string) => {
      addFavoriteMutation.mutate(menuCode)
    },
    [addFavoriteMutation],
  )

  const handleRemoveFavorite = useCallback(
    (menuCode: string) => {
      removeFavoriteMutation.mutate(menuCode)
    },
    [removeFavoriteMutation],
  )

  // Menu search
  const [searchQuery, setSearchQuery] = useState('')

  // Filter menu tree by search query (returns parents that contain matching children)
  const filterMenuBySearch = useCallback(
    (items: BackendMenuItem[], query: string): BackendMenuItem[] => {
      if (!query.trim()) return items
      const lowerQuery = query.toLowerCase()

      return items
        .map((item) => {
          const label = getMenuLabel(item, currentLang).toLowerCase()
          const matchesSelf = label.includes(lowerQuery)
          const filteredChildren = item.items ? filterMenuBySearch(item.items, query) : []

          if (matchesSelf || filteredChildren.length > 0) {
            return { ...item, items: matchesSelf ? item.items : filteredChildren }
          }
          return null
        })
        .filter(Boolean) as BackendMenuItem[]
    },
    [currentLang],
  )

  // Sort and filter menu items
  const sortedMenuItems = useMemo(() => {
    return [...rootMenuItems]
      .filter((item) => item.active !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  }, [rootMenuItems])

  // Separate system menu from regular menus (driven by backend menuType field)
  const { mainMenuItems, systemMenuItems } = useMemo(() => {
    const main: BackendMenuItem[] = []
    const system: BackendMenuItem[] = []
    const filtered = searchQuery
      ? filterMenuBySearch(sortedMenuItems, searchQuery)
      : sortedMenuItems
    for (const item of filtered) {
      if (item.menuType === 'system') {
        system.push(item)
      } else {
        main.push(item)
      }
    }
    return { mainMenuItems: main, systemMenuItems: system }
  }, [sortedMenuItems, searchQuery, filterMenuBySearch])

  // Flatten menu tree for favorite/recent item lookup
  const allFlatItems = useMemo(() => {
    return flattenMenuTree(rootMenuItems)
  }, [rootMenuItems])

  // Track recently visited menu pages
  useEffect(() => {
    if (allFlatItems.length === 0) return
    const matchedItem = allFlatItems.find(
      (item) =>
        item.url &&
        (location.pathname === item.url || location.pathname.startsWith(item.url + '/')),
    )
    if (matchedItem) {
      addRecent(matchedItem.id)
    }
  }, [location.pathname, allFlatItems, addRecent])

  // Get favorite menu items with their labels
  const favoriteItems = useMemo(() => {
    return favorites
      .sort((a, b) => a.orderNumber - b.orderNumber)
      .map((fav) => {
        const menuItem = allFlatItems.find((m) => m.id === fav.menuCode)
        return menuItem ? { ...menuItem, favoriteCode: fav.menuCode } : null
      })
      .filter(Boolean) as (BackendMenuItem & { favoriteCode: string })[]
  }, [favorites, allFlatItems])

  // Get recently visited menu items (excluding current favorites to avoid duplication)
  const recentMenuItems = useMemo(() => {
    const favoriteIds = new Set(favorites.map((f) => f.menuCode))
    return recentItems
      .filter((r) => !favoriteIds.has(r.menuId))
      .map((r) => allFlatItems.find((m) => m.id === r.menuId))
      .filter(Boolean) as BackendMenuItem[]
  }, [recentItems, allFlatItems, favorites])

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}

      <aside
        aria-label={t('Sidebar')}
        className={cn(
          'card-white fixed z-40 flex h-screen flex-col border-r transition-all duration-300 md:relative',
          'md:translate-x-0',
          open ? 'w-72 translate-x-0' : '-translate-x-full md:w-20 md:translate-x-0',
        )}
      >
        {/* Header */}
        <div className="card-white flex h-14 items-center justify-between border-b px-3 shadow-[var(--shadow-sm)] md:h-16 md:px-4">
          {open ? (
            <div className="flex items-center gap-2.5 md:gap-3">
              <div className="layout-bg border-color-light flex h-9 w-9 items-center justify-center rounded-lg border p-2 md:h-10 md:w-10">
                <img src={hemisLogo} alt="HEMIS" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-color-primary text-base font-bold md:text-lg">HEMIS</span>
                <span className="text-color-secondary text-xs">{t('Ministry Portal')}</span>
              </div>
            </div>
          ) : (
            <div className="layout-bg border-color-light mx-auto hidden h-9 w-9 items-center justify-center rounded-lg border p-2 md:flex md:h-10 md:w-10">
              <img src={hemisLogo} alt="HEMIS" className="h-full w-full object-contain" />
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="text-color-secondary hover:layout-bg flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:text-[var(--primary)]"
            aria-label={open ? t('Close menu') : t('Open menu')}
            aria-expanded={open}
          >
            {open ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto px-2.5 py-3 md:px-3 md:py-4"
          aria-label={t('Main navigation')}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-color-secondary text-sm">{t('Loading...')}</div>
            </div>
          ) : menuError ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-red-500">{t('Something went wrong')}</div>
            </div>
          ) : sortedMenuItems.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-color-secondary text-sm">{t('No menu items available')}</div>
            </div>
          ) : (
            <>
              {open && <SidebarSearchBox value={searchQuery} onChange={setSearchQuery} />}

              {open && (
                <SidebarFavoritesSection
                  items={favoriteItems}
                  currentLang={currentLang}
                  location={location}
                />
              )}

              {open && !searchQuery && (
                <SidebarRecentSection
                  items={recentMenuItems}
                  currentLang={currentLang}
                  location={location}
                  showSeparator={favoriteItems.length === 0}
                />
              )}

              {/* Main Menu Items */}
              <div className="space-y-1">
                {mainMenuItems.map((item) => (
                  <MenuItemComponent
                    key={item.id}
                    item={item}
                    level={0}
                    open={open}
                    currentLang={currentLang}
                    location={location}
                    expandedMenus={expandedMenus}
                    toggleSubmenu={toggleSubmenu}
                    setOpen={setOpen}
                    showFavoriteStar
                    onAddFavorite={handleAddFavorite}
                    onRemoveFavorite={handleRemoveFavorite}
                  />
                ))}
              </div>

              {/* System Separator + System Menu */}
              {systemMenuItems.length > 0 && (
                <>
                  <div className="my-3 h-px bg-[var(--border-color-pro)]" />
                  <div className="space-y-1">
                    {systemMenuItems.map((item) => (
                      <MenuItemComponent
                        key={item.id}
                        item={item}
                        level={0}
                        open={open}
                        currentLang={currentLang}
                        location={location}
                        expandedMenus={expandedMenus}
                        toggleSubmenu={toggleSubmenu}
                        setOpen={setOpen}
                        showFavoriteStar
                        onAddFavorite={handleAddFavorite}
                        onRemoveFavorite={handleRemoveFavorite}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </nav>

        {/* Footer — version stamp only.
            The product brand ("HEMIS / Ministry Portal") is already shown in
            the sidebar header; repeating the same logo + name in a footer
            card was visual noise. A muted version line is enough — it gives
            ops a stamp to ask about ("which build are you on?") without
            cluttering the chrome. */}
        {open && (
          <div className="border-color-light border-t px-4 py-2.5 md:py-3">
            <p className="text-color-secondary text-center text-[11px] font-medium tracking-wide">
              v2.0.0
            </p>
          </div>
        )}
      </aside>
    </>
  )
}

export default memo(Sidebar)
