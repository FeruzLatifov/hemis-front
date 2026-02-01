/**
 * Sidebar Component - Backend Integration
 *
 * Dynamic menu loaded from backend API with permission filtering
 * Supports multilingual labels (uz/ru/en)
 * Features: Favorites section, system separator, command palette hint
 */

import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  GraduationCap,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Menu,
  Star,
} from 'lucide-react'
import { useRootMenuItems, useMenuLoading } from '../../stores/menuStore'
import { useFavoritesStore, useFavoritesList } from '../../stores/favoritesStore'
import { getIcon } from '../../utils/iconMapper'
import type { MenuItem as BackendMenuItem } from '../../api/menu.api'
import { flattenMenuTree } from '../../api/menu.api'
import hemisLogo from '../../assets/images/hemis-logo-new.png'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

/**
 * Get label for menu item based on current language
 * Supports 4 languages: uz (Latin), oz (Cyrillic), ru (Russian), en (English)
 */
const getMenuLabel = (item: BackendMenuItem, lang: string): string => {
  switch (lang) {
    case 'oz':
      return item.labelOz || item.labelUz
    case 'ru':
      return item.labelRu || item.labelUz
    case 'en':
      return item.labelEn || item.labelUz
    default:
      return item.labelUz
  }
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
}

function MenuItemComponent({
  item,
  level,
  open,
  currentLang,
  location,
  expandedMenus,
  toggleSubmenu,
  setOpen,
  showFavoriteStar = false,
}: MenuItemComponentProps) {
  const Icon = getIcon(item.icon)
  const label = getMenuLabel(item, currentLang)
  const hasChildren = item.items && item.items.length > 0
  const isExpanded = expandedMenus.has(item.id)
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore()

  if (hasChildren) {
    const hasActiveChild = item.items!.some((child) =>
      checkActiveInTree(child, location.pathname)
    )

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
                  : 'sidebar-menu-item-child'
            )}
          >
            <Icon className={cn(level === 0 && !open ? 'h-6 w-6' : 'h-5 w-5')} />
            {open && (
              <>
                <span className="flex-1 font-medium text-left">{label}</span>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </>
            )}
          </button>
        </div>

        {open && isExpanded && (
          <div className={cn('mt-1 space-y-1', level === 0 ? 'ml-3' : 'ml-4')}>
            {item.items!
              .filter((child) => child.visible !== false)
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
                />
              ))}
          </div>
        )}
      </div>
    )
  }

  // Leaf node (no children)
  const isActive = item.url ? location.pathname === item.url || location.pathname.startsWith(item.url + '/') : false
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
              : 'sidebar-menu-item-child'
        )}
      >
        <Icon className={cn(level === 0 && !open ? 'h-6 w-6' : level === 0 ? 'h-5 w-5' : 'h-4 w-4')} />
        {open && (
          <span className="flex-1 font-medium">{label}</span>
        )}
      </Link>
      {/* Favorite star button (visible on hover when sidebar is open) */}
      {showFavoriteStar && open && item.url && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (isFav) {
              removeFavorite(item.id)
            } else {
              addFavorite(item.id)
            }
          }}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded transition-all',
            isFav
              ? 'text-yellow-500 opacity-100'
              : 'text-color-secondary opacity-0 group-hover:opacity-100 hover:text-yellow-500'
          )}
          title={isFav ? 'Favoritdan o\'chirish' : 'Favoritga qo\'shish'}
        >
          <Star className={cn('h-3.5 w-3.5', isFav && 'fill-current')} />
        </button>
      )}
    </div>
  )
}

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

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation()
  const { i18n, t } = useTranslation()
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  const rootMenuItems = useRootMenuItems()
  const isLoading = useMenuLoading()
  const favorites = useFavoritesList()

  const currentLang = i18n.language || 'uz'

  const toggleSubmenu = (itemId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

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
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed md:relative flex h-screen flex-col border-r transition-all duration-300 z-40 card-white',
          'md:translate-x-0',
          open ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 md:w-20'
        )}
      >
        {/* Header */}
        <div
          className="flex h-14 md:h-16 items-center justify-between px-3 md:px-4 border-b card-white"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
        {open ? (
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg p-2 layout-bg border border-color-light">
              <img
                src={hemisLogo}
                alt="HEMIS"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-bold text-color-primary">
                HEMIS
              </span>
              <span className="text-xs text-color-secondary">
                Ministry Portal
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto hidden md:flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg p-2 layout-bg border border-color-light">
            <img
              src={hemisLogo}
              alt="HEMIS"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-color-secondary hover:layout-bg hover:text-[var(--primary)]"
          aria-label={open ? 'Menyuni yopish' : 'Menyuni ochish'}
          aria-expanded={open}
        >
          {open ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 md:px-3 py-3 md:py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-color-secondary">
              Loading menu...
            </div>
          </div>
        ) : sortedMenuItems.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-color-secondary">
              No menu items available
            </div>
          </div>
        ) : (
          <>
            {/* Favorites Section */}
            {open && favoriteItems.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-semibold text-color-secondary uppercase tracking-wider">
                    {t('Quick links')}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {favoriteItems.map((item) => {
                    const Icon = getIcon(item.icon)
                    const label = getMenuLabel(item, currentLang)
                    const isActive = item.url ? location.pathname === item.url || location.pathname.startsWith(item.url + '/') : false
                    return (
                      <Link
                        key={`fav-${item.id}`}
                        to={item.url || '#'}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                          isActive
                            ? 'sidebar-menu-item-child--active'
                            : 'sidebar-menu-item-child'
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
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 md:p-4 border-color-light">
        {open ? (
          <div className="flex items-center gap-2.5 md:gap-3 rounded-lg px-2.5 md:px-3 py-2 layout-bg border border-color-light">
            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-[var(--primary)]">
              <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-color-primary">
                HEMIS Ministry
              </p>
              <p className="text-xs text-color-secondary">
                v2.0.0
              </p>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex justify-center">
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
