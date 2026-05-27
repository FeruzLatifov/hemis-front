import { memo } from 'react'
import { Link, type Location } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIcon } from '@/utils/iconMapper'
import { getMenuLabel } from '@/utils/menu.util'
import type { MenuItem as BackendMenuItem } from '@/api/menu.api'

interface SidebarFavoritesSectionProps {
  items: (BackendMenuItem & { favoriteCode: string })[]
  currentLang: string
  location: Location
}

function SidebarFavoritesSection({ items, currentLang, location }: SidebarFavoritesSectionProps) {
  const { t } = useTranslation()
  if (items.length === 0) return null

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center gap-2 px-3 py-1.5">
        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
        <span className="text-color-secondary text-xs font-semibold tracking-wider uppercase">
          {t('Quick links')}
        </span>
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = getIcon(item.icon)
          const label = getMenuLabel(item, currentLang)
          const isActive = item.url
            ? location.pathname === item.url || location.pathname.startsWith(item.url + '/')
            : false
          return (
            <Link
              key={`fav-${item.id}`}
              to={item.url || '#'}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                isActive ? 'sidebar-menu-item-child--active' : 'sidebar-menu-item-child',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
      <div className="mt-3 mb-2 h-px bg-[var(--border-color-pro)]" />
    </div>
  )
}

export default memo(SidebarFavoritesSection)
