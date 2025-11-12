/**
 * Sidebar Component - Backend Integration
 *
 * Dynamic menu loaded from backend API with permission filtering
 * Supports multilingual labels (uz/ru/en)
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
} from 'lucide-react'
import { useRootMenuItems, useMenuLoading } from '../../stores/menuStore'
import { getIcon } from '../../utils/iconMapper'
import type { MenuItem as BackendMenuItem } from '../../api/menu.api'
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
}

function MenuItemComponent({
  item,
  level,
  open,
  currentLang,
  location,
  expandedMenus,
  toggleSubmenu,
  setOpen
}: MenuItemComponentProps) {
  const Icon = getIcon(item.icon)
  const label = getMenuLabel(item, currentLang)
  const hasChildren = item.items && item.items.length > 0
  const isExpanded = expandedMenus.has(item.id)

  if (hasChildren) {
    const hasActiveChild = item.items!.some((child) =>
      checkActiveInTree(child, location.pathname)
    )

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (!open && level === 0) setOpen(true)
            toggleSubmenu(item.id)
          }}
          className={cn(
            'group relative flex w-full items-center gap-3 rounded-lg px-3 transition-all duration-200',
            level === 0 ? 'py-2.5' : 'py-2 text-sm',
            !open && level === 0 && 'justify-center'
          )}
          style={
            hasActiveChild
              ? {
                  backgroundColor: level === 0 ? '#2F80ED' : '#EFF6FF',
                  color: level === 0 ? '#FFFFFF' : '#2F80ED',
                  boxShadow: level === 0 ? '0 1px 2px rgba(15, 23, 42, 0.04)' : 'none'
                }
              : { color: level === 0 ? '#1E2124' : '#6B7280' }
          }
          onMouseEnter={(e) => {
            if (!hasActiveChild) {
              e.currentTarget.style.backgroundColor = level === 0 ? '#F5F6FA' : '#F5F6FA'
            }
          }}
          onMouseLeave={(e) => {
            if (!hasActiveChild) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <Icon className={cn(level === 0 && !open ? 'h-6 w-6' : 'h-5 w-5')} />
          {open && (
            <>
              <span className="flex-1 font-medium text-left">{label}</span>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </>
          )}
        </button>

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
                />
              ))}
          </div>
        )}
      </div>
    )
  }

  // Leaf node (no children)
  const isActive = item.url ? location.pathname === item.url : false
  return (
    <Link
      key={item.id}
      to={item.url || '#'}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 transition-all duration-200',
        level === 0 ? 'py-2.5' : 'py-2 text-sm',
        !open && level === 0 && 'justify-center'
      )}
      style={
        isActive
          ? {
              backgroundColor: level === 0 ? '#2F80ED' : '#EFF6FF',
              color: level === 0 ? '#FFFFFF' : '#2F80ED',
              boxShadow: level === 0 ? '0 1px 2px rgba(15, 23, 42, 0.04)' : 'none'
            }
          : { color: level === 0 ? '#1E2124' : '#6B7280' }
      }
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#F5F6FA'
          if (level > 0) {
            e.currentTarget.style.color = '#1E2124'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = level === 0 ? '#1E2124' : '#6B7280'
        }
      }}
    >
      <Icon className={cn(level === 0 && !open ? 'h-6 w-6' : level === 0 ? 'h-5 w-5' : 'h-4 w-4')} />
      {open && (
        <span className="flex-1 font-medium">{label}</span>
      )}
    </Link>
  )
}

/**
 * Check if any item in tree is active
 */
function checkActiveInTree(item: BackendMenuItem, pathname: string): boolean {
  if (item.url && pathname === item.url) {
    return true
  }
  if (item.items && item.items.length > 0) {
    return item.items.some((child) => checkActiveInTree(child, pathname))
  }
  return false
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation()
  const { i18n } = useTranslation()
  // Track expanded menus at each level for nested accordion behavior
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  // Get menu items from store
  const rootMenuItems = useRootMenuItems()
  const isLoading = useMenuLoading()

  // Get current language
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

  // Sort menu items by orderNum
  const sortedMenuItems = useMemo(() => {
    return [...rootMenuItems]
      .filter((item) => item.visible)
      .sort((a, b) => {
        const aOrder = a.orderNum ?? 999;
        const bOrder = b.orderNum ?? 999;
        return aOrder - bOrder;
      })
  }, [rootMenuItems])

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
          'fixed md:relative flex h-screen flex-col border-r transition-all duration-300 z-40',
          'md:translate-x-0',
          open ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 md:w-20'
        )}
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E7EB'
        }}
      >
        {/* Header */}
        <div
          className="flex h-14 md:h-16 items-center justify-between px-3 md:px-4 border-b"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#E5E7EB',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
          }}
        >
        {open ? (
          <div className="flex items-center gap-2.5 md:gap-3">
            {/* Logo */}
            <div
              className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg p-2"
              style={{
                backgroundColor: '#F5F6FA',
                border: '1px solid #E5E7EB'
              }}
            >
              <img
                src={hemisLogo}
                alt="HEMIS"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Title */}
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-bold" style={{ color: '#1E2124' }}>
                HEMIS
              </span>
              <span className="text-xs" style={{ color: '#6B7280' }}>
                Ministry Portal
              </span>
            </div>
          </div>
        ) : (
          <div
            className="mx-auto hidden md:flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg p-2"
            style={{
              backgroundColor: '#F5F6FA',
              border: '1px solid #E5E7EB'
            }}
          >
            <img
              src={hemisLogo}
              alt="HEMIS"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setOpen(!open)}
          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
          style={{
            color: '#6B7280'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F6FA'
            e.currentTarget.style.color = '#2F80ED'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#6B7280'
          }}
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
            <div className="text-sm" style={{ color: '#6B7280' }}>
              Loading menu...
            </div>
          </div>
        ) : sortedMenuItems.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm" style={{ color: '#6B7280' }}>
              No menu items available
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedMenuItems.map((item) => (
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
              />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        className="border-t p-3 md:p-4"
        style={{
          borderColor: '#E5E7EB'
        }}
      >
        {open ? (
          <div
            className="flex items-center gap-2.5 md:gap-3 rounded-lg px-2.5 md:px-3 py-2"
            style={{
              backgroundColor: '#F5F6FA',
              border: '1px solid #E5E7EB'
            }}
          >
            <div
              className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: '#2F80ED'
              }}
            >
              <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4" style={{ color: '#FFFFFF' }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: '#1E2124' }}>
                HEMIS Ministry
              </p>
              <p className="text-xs" style={{ color: '#6B7280' }}>
                v2.0.0
              </p>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex justify-center">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: '#2F80ED'
              }}
            >
              <GraduationCap className="h-4 w-4" style={{ color: '#FFFFFF' }} />
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
