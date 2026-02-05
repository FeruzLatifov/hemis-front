/**
 * Header Component
 *
 * Clean professional design - no gradients, no glass effects
 * Matches LoginClean.tsx design system
 */

import { Settings, User, LogOut, Bell, Menu, RefreshCw, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { useClearCache } from '@/hooks/useClearCache'

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { isClearingCache, clearCache } = useClearCache()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Keyboard navigation for user dropdown
  const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false)
    }
  }, [])

  return (
    <header
      className="card-white flex h-14 items-center justify-between border-b px-3 md:h-16 md:justify-end md:px-6"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Left Side - Mobile Menu Button (only on mobile) */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="header-btn flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
        aria-label={t('Open menu')}
      >
        <Menu className="text-color-secondary h-5 w-5" />
      </button>

      {/* Right Side - Notifications and User Menu */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search Button (Ctrl+K) */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
          }}
          className="header-btn text-color-secondary hover:text-color-primary hidden h-9 items-center gap-2 rounded-lg border px-3 md:flex md:h-10"
          aria-label={t('Search pages (Ctrl+K)')}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs">{t('Search...')}</span>
          <kbd className="text-color-secondary hidden items-center gap-0.5 rounded border bg-[var(--bg-pro)] px-1.5 py-0.5 text-[10px] font-medium lg:inline-flex">
            Ctrl+K
          </kbd>
        </button>

        {/* Notifications Button */}
        <button
          type="button"
          className="header-btn relative flex h-9 w-9 items-center justify-center rounded-lg border md:h-10 md:w-10"
          aria-label={t('Notifications')}
        >
          <Bell className="text-color-secondary h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
          {/* Notification Badge */}
          <span
            className="badge-danger absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-semibold md:h-5 md:w-5"
            aria-hidden="true"
          >
            3
          </span>
        </button>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Cache Clear Button */}
        <button
          type="button"
          onClick={clearCache}
          disabled={isClearingCache}
          className="header-btn header-btn-success relative flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-50 md:h-10 md:w-10"
          title={t('Clear cache')}
          aria-label={t('Clear cache')}
        >
          <RefreshCw
            className={`h-4 w-4 md:h-5 md:w-5 ${isClearingCache ? 'animate-spin text-[var(--success)]' : 'text-color-secondary'}`}
          />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="header-btn flex items-center gap-2 rounded-lg border px-2 py-1.5 md:gap-3 md:px-3 md:py-2"
            aria-label={t('User menu')}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            {/* Avatar */}
            <div className="avatar-primary flex h-7 w-7 items-center justify-center rounded-full md:h-8 md:w-8">
              <User className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
            </div>

            {/* User Name */}
            <span className="text-color-primary hidden text-sm font-medium sm:block md:text-base">
              {user?.username || 'Admin'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="card-white absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border"
              style={{ boxShadow: '0 4px 6px rgba(15, 23, 42, 0.1)' }}
              role="menu"
              tabIndex={0}
              aria-label={t('User menu')}
              onKeyDown={handleDropdownKeyDown}
            >
              {/* User Info Header */}
              <div className="layout-bg border-color-light border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="avatar-primary flex h-12 w-12 items-center justify-center rounded-full">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-color-primary text-sm font-semibold">
                      {user?.username || 'Administrator'}
                    </p>
                    <p className="text-color-secondary text-xs">
                      {user?.email || 'admin@hemis.uz'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1" role="none">
                <button
                  type="button"
                  className="dropdown-item flex w-full items-center gap-3 px-4 py-3"
                  role="menuitem"
                >
                  <User className="text-color-secondary h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{t('Profile')}</span>
                </button>

                <button
                  type="button"
                  className="dropdown-item flex w-full items-center gap-3 px-4 py-3"
                  role="menuitem"
                >
                  <Settings className="text-color-secondary h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{t('Settings')}</span>
                </button>

                <div className="my-1 h-px bg-[var(--border-color-pro)]" role="separator" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="dropdown-item-danger flex w-full items-center gap-3 px-4 py-3"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{t('Logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
