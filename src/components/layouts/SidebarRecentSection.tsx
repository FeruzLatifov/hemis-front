import { memo } from 'react'
import { Link, type Location } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIcon } from '@/utils/iconMapper'
import { getMenuLabel } from '@/utils/menu.util'
import type { MenuItem as BackendMenuItem } from '@/api/menu.api'

interface SidebarRecentSectionProps {
  items: BackendMenuItem[]
  currentLang: string
  location: Location
  showSeparator: boolean
}

function SidebarRecentSection({
  items,
  currentLang,
  location,
  showSeparator,
}: SidebarRecentSectionProps) {
  const { t } = useTranslation()
  if (items.length === 0) return null

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center gap-2 px-3 py-1.5">
        <Clock className="text-color-secondary h-3.5 w-3.5" />
        <span className="text-color-secondary text-xs font-semibold tracking-wider uppercase">
          {t('Recently visited')}
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
              key={`recent-${item.id}`}
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
      {showSeparator && <div className="mt-3 mb-2 h-px bg-[var(--border-color-pro)]" />}
    </div>
  )
}

export default memo(SidebarRecentSection)
