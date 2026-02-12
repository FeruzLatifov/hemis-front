/**
 * Sidebar Component - Backend Integration
 *
 * Dynamic menu loaded from backend API with permission filtering
 * Supports multilingual labels (uz/ru/en)
 * Features: Favorites section, system separator, command palette hint
 */

import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { GraduationCap, ChevronLeft, ChevronDown, ChevronRight, Menu, Star } from 'lucide-react'
import { useRootMenuItems, useMenuLoading } from '@/stores/menuStore'
import { useFavoritesStore, useFavoritesList } from '@/stores/favoritesStore'
import { useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites'
import { getIcon } from '@/utils/iconMapper'
import type { MenuItem as BackendMenuItem } from '@/api/menu.api'
import { flattenMenuTree } from '@/api/menu.api'
import { getMenuLabel } from '@/utils/menu.util'
import hemisLogo from '@/assets/images/hemis-logo-new.png'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

/**
 * Recursive Menu Item Component
 * Supports unlimited nesting levels
 */
interface MenuItemComponentProps {
  item: BackendMenuItem
  level: number
  open: boolean
  currentLang: string
  location: ReturnType<typeof useLocation>
  expandedMenus: Set<string>
  toggleSubmenu: (itemId: string) => void
  setOpen: (open: boolean) => void
  showFavoriteStar?: boolean
  onAddFavorite: (menuCode: string) => void
  onRemoveFavorite: (menuCode: string) => void
}

/**
 * Memoized recursive menu item component
 * Prevents unnecessary re-renders in deep menu trees
 */
const MenuItemComponent = memo(function MenuItemComponent({
  item,
  level,
  open,
  currentLang,
  location,
  expandedMenus,
  toggleSubmenu,
  setOpen,
  showFavoriteStar = false,
  onAddFavorite,
  onRemoveFavorite,
}: MenuItemComponentProps) {
  const { t } = useTranslation()
  const Icon = getIcon(item.icon)
  const label = getMenuLabel(item, currentLang)
  const hasChildren = item.items && item.items.length > 0
  const isExpanded = expandedMenus.has(item.id)
  const { isFavorite } = useFavoritesStore()

  if (hasChildren) {
    const hasActiveChild = item.items!.some((child) => checkActiveInTree(child, location.pathname))

    return (
      <div key={item.id}>
        <div className="group relative">
          <button
            onClick={() => {
              if (!open && level === 0) setOpen(true)
              toggleSubmenu(item.id)
            }}
            className={cn(
              'relative flex w-full items-center gap-3 rounded-lg px-3 transition-all duration-200',
              level === 0 ? 'py-2.5' : 'py-2 text-sm',
              !open && level === 0 && 'justify-center',
              level === 0
                ? hasActiveChild
                  ? 'sidebar-menu-item--active'
                  : 'sidebar-menu-item'
                : hasActiveChild
                  ? 'sidebar-menu-item-child--active'
                  : 'sidebar-menu-item-child',
            )}
          >
            <Icon className={cn(level === 0 && !open ? 'h-6 w-6' : 'h-5 w-5')} />
            {open && (
              <>
                <span className="flex-1 text-left font-medium">{label}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </>
            )}
          </button>
        </div>

        {open && isExpanded && (
          <div className={cn('mt-1 space-y-1', level === 0 ? 'ml-3' : 'ml-4')}>
            {item
              .items!.filter((child) => child.visible !== false)
              .sort((a, b) => (a.orderNum || a.order || 0) - (b.orderNum || b.order || 0))
              .map((child) => (
                <MenuItemComponent
                  key={child.id}
                  item={child}
                  level={level + 1}
                  open={open}
                  currentLang={currentLang}
                  location={location}
                  expandedMenus={expandedMenus}
                  toggleSubmenu={toggleSubmenu}
                  setOpen={setOpen}
                  showFavoriteStar={showFavoriteStar}
                  onAddFavorite={onAddFavorite}
                  onRemoveFavorite={onRemoveFavorite}
                />
              ))}
          </div>
        )}
      </div>
    )
  }

  // Leaf node (no children)
  const isActive = item.url
    ? location.pathname === item.url || location.pathname.startsWith(item.url + '/')
    : false
  const isFav = isFavorite(item.id)

  return (
    <div className="group relative">
      <Link
        key={item.id}
        to={item.url || '#'}
        className={cn(
          'relative flex items-center gap-3 rounded-lg px-3 transition-all duration-200',
          level === 0 ? 'py-2.5' : 'py-2 text-sm',
          !open && level === 0 && 'justify-center',
          level === 0
            ? isActive
              ? 'sidebar-menu-item--active'
              : 'sidebar-menu-item'
            : isActive
              ? 'sidebar-menu-item-child--active'
              : 'sidebar-menu-item-child',
        )}
      >
        <Icon
          className={cn(level === 0 && !open ? 'h-6 w-6' : level === 0 ? 'h-5 w-5' : 'h-4 w-4')}
        />
        {open && <span className="flex-1 font-medium">{label}</span>}
      </Link>
      {/* Favorite star button (visible on hover when sidebar is open) */}
      {showFavoriteStar && open && item.url && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (isFav) {
              onRemoveFavorite(item.id)
            } else {
              onAddFavorite(item.id)
            }
          }}
          className={cn(
            'absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded transition-all',
            isFav
              ? 'text-yellow-500 opacity-100'
              : 'text-color-secondary opacity-0 group-hover:opacity-100 hover:text-yellow-500',
          )}
          title={isFav ? t('Remove from favorites') : t('Add to favorites')}
        >
          <Star className={cn('h-3.5 w-3.5', isFav && 'fill-current')} />
        </button>
      )}
    </div>
  )
})

/**
 * Check if any item in tree is active
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

function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation()
  const { i18n, t } = useTranslation()
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  const rootMenuItems = useRootMenuItems()
  const isLoading = useMenuLoading()
  const favorites = useFavoritesList()

  const currentLang = i18n.language || 'uz'

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

  // Sort and filter menu items
  const sortedMenuItems = useMemo(() => {
    return [...rootMenuItems]
      .filter((item) => item.visible !== false)
      .sort((a, b) => {
        const aOrder = a.orderNum ?? 999
        const bOrder = b.orderNum ?? 999
        return aOrder - bOrder
      })
  }, [rootMenuItems])

  // Separate system menu from regular menus
  const { mainMenuItems, systemMenuItems } = useMemo(() => {
    const main: BackendMenuItem[] = []
    const system: BackendMenuItem[] = []
    for (const item of sortedMenuItems) {
      if (item.icon === 'settings' || item.permission === 'system.view') {
        system.push(item)
      } else {
        main.push(item)
      }
    }
    return { mainMenuItems: main, systemMenuItems: system }
  }, [sortedMenuItems])

  // Flatten menu tree for favorite item lookup
  const allFlatItems = useMemo(() => {
    return flattenMenuTree(rootMenuItems)
  }, [rootMenuItems])

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
        <div
          className="card-white flex h-14 items-center justify-between border-b px-3 md:h-16 md:px-4"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
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
          className="flex-1 overflow-y-auto px-2.5 py-3 md:px-3 md:py-4"
          aria-label={t('Main navigation')}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-color-secondary text-sm">{t('Menyu yuklanmoqda...')}</div>
            </div>
          ) : sortedMenuItems.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-color-secondary text-sm">
                {t('Menyu elementlari mavjud emas')}
              </div>
            </div>
          ) : (
            <>
              {/* Favorites Section */}
              {open && favoriteItems.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1 flex items-center gap-2 px-3 py-1.5">
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    <span className="text-color-secondary text-xs font-semibold tracking-wider uppercase">
                      {t('Quick links')}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {favoriteItems.map((item) => {
                      const Icon = getIcon(item.icon)
                      const label = getMenuLabel(item, currentLang)
                      const isActive = item.url
                        ? location.pathname === item.url ||
                          location.pathname.startsWith(item.url + '/')
                        : false
                      return (
                        <Link
                          key={`fav-${item.id}`}
                          to={item.url || '#'}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                            isActive
                              ? 'sidebar-menu-item-child--active'
                              : 'sidebar-menu-item-child',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1 font-medium">{label}</span>
                        </Link>
                      )
                    })}
                  </div>
                  {/* Separator */}
                  <div className="mt-3 mb-2 h-px bg-[var(--border-color-pro)]" />
                </div>
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

        {/* Footer */}
        <div className="border-color-light border-t p-3 md:p-4">
          {open ? (
            <div className="layout-bg border-color-light flex items-center gap-2.5 rounded-lg border px-2.5 py-2 md:gap-3 md:px-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] md:h-8 md:w-8">
                <GraduationCap className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
              </div>
              <div className="flex-1">
                <p className="text-color-primary text-xs font-medium">HEMIS Ministry</p>
                <p className="text-color-secondary text-xs">v2.0.0</p>
              </div>
            </div>
          ) : (
            <div className="hidden justify-center md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default memo(Sidebar)
