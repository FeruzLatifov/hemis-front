/**
 * Breadcrumb Component
 *
 * Auto-generates breadcrumb trail from menu tree and current URL
 * Supports multilingual labels from backend menu items
 */

import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n/config'
import { Home, ChevronRight } from 'lucide-react'
import { useRootMenuItems } from '@/stores/menuStore'
import type { MenuItem } from '@/api/menu.api'
import { getMenuLabel } from '@/utils/menu.util'

interface BreadcrumbItem {
  label: string
  url?: string
}

/**
 * Find path from root to target URL in menu tree
 * Returns array of menu items forming the breadcrumb trail
 */
function findBreadcrumbPath(
  items: MenuItem[],
  targetUrl: string,
  lang: string,
): BreadcrumbItem[] | null {
  for (const item of items) {
    if (item.url === targetUrl) {
      return [{ label: getMenuLabel(item, lang), url: item.url }]
    }

    if (item.items && item.items.length > 0) {
      const childPath = findBreadcrumbPath(item.items, targetUrl, lang)
      if (childPath) {
        return [{ label: getMenuLabel(item, lang), url: item.url }, ...childPath]
      }
    }
  }
  return null
}

/**
 * Fallback labels for routes not in menu tree
 */
const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  registry: 'Registry',
  'e-reestr': 'E-Registry',
  university: 'Universities',
  faculty: 'Faculties',
  students: 'Students',
  teachers: 'Teachers',
  universities: 'Universities',
  reports: 'Reports',
  system: 'System',
  translation: 'Translations',
  create: 'Create',
  edit: 'Edit',
}

function getFallbackLabel(segment: string): string {
  const key = ROUTE_LABELS[segment]
  if (key) {
    return i18n.t(key)
  }
  // If it looks like a UUID or ID, show "Edit"
  if (/^[0-9a-f-]{8,}$/i.test(segment)) {
    return i18n.t('Edit')
  }
  // Capitalize first letter as last resort
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export default function Breadcrumb() {
  const location = useLocation()
  const { i18n } = useTranslation()
  const menuItems = useRootMenuItems()
  const currentLang = i18n.language || 'uz'

  const breadcrumbs = useMemo(() => {
    const pathname = location.pathname

    // Don't show breadcrumb on dashboard
    if (pathname === '/dashboard' || pathname === '/') {
      return []
    }

    // Try to find path in menu tree
    const menuPath = findBreadcrumbPath(menuItems, pathname, currentLang)

    if (menuPath) {
      return menuPath
    }

    // Fallback: build from URL segments
    const segments = pathname.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = []
    let currentPath = ''

    for (const segment of segments) {
      currentPath += `/${segment}`

      // Try to find this partial path in menu
      const menuItem = findBreadcrumbPath(menuItems, currentPath, currentLang)
      if (menuItem && menuItem.length > 0) {
        // Use menu label for this segment
        const lastItem = menuItem[menuItem.length - 1]
        items.push({ label: lastItem.label, url: currentPath })
      } else {
        items.push({
          label: getFallbackLabel(segment),
          url: currentPath,
        })
      }
    }

    return items
  }, [location.pathname, menuItems, currentLang])

  // Don't render if no breadcrumbs
  if (breadcrumbs.length === 0) {
    return null
  }

  const homeLabel = i18n.t('Dashboard')

  return (
    <nav
      aria-label={i18n.t('Breadcrumb')}
      className="border-color-light flex items-center gap-1.5 border-b px-3 py-2.5 text-sm md:px-4 lg:px-6"
    >
      {/* Home link */}
      <Link
        to="/dashboard"
        className="text-color-secondary flex items-center gap-1 transition-colors hover:text-[var(--primary)]"
        title={homeLabel}
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">{homeLabel}</span>
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1

        return (
          <span key={index} className="flex items-center gap-1.5">
            <ChevronRight className="text-color-secondary h-3.5 w-3.5" aria-hidden="true" />
            {isLast ? (
              <span className="text-color-primary font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.url || '#'}
                className="text-color-secondary transition-colors hover:text-[var(--primary)]"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
