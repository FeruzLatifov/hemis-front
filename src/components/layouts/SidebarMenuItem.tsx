/**
 * SidebarMenuItem Component
 *
 * Recursive, memoized menu item supporting unlimited nesting levels.
 * Extracted from Sidebar.tsx to reduce file size and improve maintainability.
 */

import { memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Star } from 'lucide-react'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { getIcon } from '@/utils/iconMapper'
import type { MenuItem as BackendMenuItem } from '@/api/menu.api'
import { getMenuLabel } from '@/utils/menu.util'
import { checkActiveInTree } from './menu-tree.util'

export interface MenuItemComponentProps {
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
    const isParentActive = item.url
      ? location.pathname === item.url || location.pathname.startsWith(item.url + '/')
      : false

    // Parent with URL navigates on click; expand toggle is a separate chevron button.
    // Parent without URL just toggles the submenu.
    const parentHasUrl = !!item.url

    return (
      <div key={item.id}>
        <div className="group relative flex items-center">
          {parentHasUrl ? (
            // Navigate + auto-expand
            <Link
              to={item.url!}
              onClick={() => {
                if (!open && level === 0) setOpen(true)
                if (!isExpanded) toggleSubmenu(item.id)
              }}
              className={cn(
                'relative flex flex-1 items-center gap-3 rounded-lg px-3 transition-all duration-200',
                level === 0 ? 'py-2.5' : 'py-2 text-sm',
                !open && level === 0 && 'justify-center',
                level === 0
                  ? hasActiveChild || isParentActive
                    ? 'sidebar-menu-item--active'
                    : 'sidebar-menu-item'
                  : hasActiveChild || isParentActive
                    ? 'sidebar-menu-item-child--active'
                    : 'sidebar-menu-item-child',
              )}
            >
              <Icon className={cn(level === 0 && !open ? 'h-6 w-6' : 'h-5 w-5')} />
              {open && <span className="flex-1 text-left font-medium">{label}</span>}
            </Link>
          ) : (
            // No URL — just toggle submenu
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
          )}
          {/* Chevron toggle for parents with URL (separate from Link) */}
          {parentHasUrl && open && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleSubmenu(item.id)
              }}
              className="text-color-secondary hover:text-color-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
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
        data-active={isActive || undefined}
        className={cn(
          'relative flex items-center gap-3 rounded-lg px-3 transition-all duration-200',
          level === 0 ? 'py-2.5' : 'py-2 text-sm',
          !open && level === 0 && 'justify-center',
          // Reserve right-side space so the favorite star never overlaps the label.
          showFavoriteStar && open && item.url && (level === 0 ? 'pr-9' : 'pr-8'),
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
      {/* Favorite star — hidden until row hover/focus.
          Showing the star always-on creates visual noise next to every leaf item;
          this matches the Notion/Linear pattern of "discoverable on intent".
          When the item *is* a favorite, the star stays visible so the user can
          un-favorite it without hunting for the affordance. */}
      {showFavoriteStar && open && item.url && (
        <button
          type="button"
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
              : 'text-color-secondary opacity-0 group-hover:opacity-100 hover:text-yellow-500 focus-visible:text-yellow-500 focus-visible:opacity-100',
          )}
          aria-label={isFav ? t('Remove from favorites') : t('Add to favorites')}
        >
          <Star className={cn('h-3.5 w-3.5', isFav && 'fill-current')} />
        </button>
      )}
    </div>
  )
})

export default MenuItemComponent
