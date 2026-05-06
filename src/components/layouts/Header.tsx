/**
 * Header — slim utility bar.
 *
 * Senior-design pass: collapsed header to the canonical 3-button rule
 * (Search · Notifications · User). Locale, theme, and cache-clear are
 * now nested inside the user menu — they're settings, not toolbar
 * actions, and a destructive one-click "clear cache" in the toolbar
 * was an accident waiting to happen.
 */

import {
  Settings,
  User,
  LogOut,
  Bell,
  Menu,
  Search,
  Languages,
  Sun,
  Moon,
  RefreshCw,
  Check,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useClearCache } from '@/hooks/useClearCache'
import { useTheme } from '@/hooks/useTheme'

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void
}

interface LanguageOption {
  code: string
  nativeName: string
  flag: string
}

const LANGUAGES: LanguageOption[] = [
  { code: 'uz', nativeName: "O'zbek", flag: '🇺🇿' },
  { code: 'oz', nativeName: 'Ўзбек', flag: '🇺🇿' },
  { code: 'ru', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'en', nativeName: 'English', flag: '🇬🇧' },
]

export default function Header({ setSidebarOpen }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const { isClearingCache, clearCache } = useClearCache()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLangSubmenuOpen, setIsLangSubmenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isDark = theme === 'dark'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setIsLangSubmenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code)
    setIsLangSubmenuOpen(false)
  }

  const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false)
      setIsLangSubmenuOpen(false)
    }
  }, [])

  const currentLanguage = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  return (
    <header
      role="banner"
      aria-label={t('Main header')}
      className="card-white flex h-14 items-center justify-between border-b px-3 shadow-[var(--shadow-sm)] md:h-16 md:justify-end md:px-6"
    >
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="header-btn flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
        aria-label={t('Open menu')}
      >
        <Menu className="text-color-secondary h-5 w-5" />
      </button>

      {/* Right cluster — Search · Notifications · User */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search (Ctrl+K) */}
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

        {/* Notifications */}
        <button
          type="button"
          className="header-btn relative flex h-9 w-9 items-center justify-center rounded-lg border md:h-10 md:w-10"
          aria-label={t('Notifications')}
        >
          <Bell className="text-color-secondary h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
          <span
            className="badge-danger absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-semibold md:h-5 md:w-5"
            aria-hidden="true"
          >
            3
          </span>
        </button>

        {/* User Menu — Lang, Theme, Cache, Logout all nested here */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen)
              setIsLangSubmenuOpen(false)
            }}
            className="header-btn flex items-center gap-2 rounded-lg border px-2 py-1.5 md:gap-3 md:px-3 md:py-2"
            aria-label={t('User menu')}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <div className="avatar-primary flex h-7 w-7 items-center justify-center rounded-full md:h-8 md:w-8">
              <User className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
            </div>
            <span className="text-color-primary hidden text-sm font-medium sm:block md:text-base">
              {user?.username || 'Admin'}
            </span>
          </button>

          {isDropdownOpen && (
            <div
              // No `overflow-hidden` on the wrapper: it would clip the
              // language sub-menu that pops out to the left. The first/last
              // children carry their own rounded corners so the visual seal
              // is preserved without truncating absolute-positioned children.
              className="card-white absolute top-full right-0 z-50 mt-2 w-72 rounded-lg border shadow-[0_4px_6px_rgba(15,23,42,0.1)]"
              role="menu"
              tabIndex={0}
              aria-label={t('User menu')}
              onKeyDown={handleDropdownKeyDown}
            >
              {/* User info */}
              <div className="layout-bg border-color-light rounded-t-lg border-b px-4 py-3">
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

              {/* Account */}
              <div className="py-1" role="none">
                <button
                  type="button"
                  className="dropdown-item flex w-full items-center gap-3 px-4 py-2.5"
                  role="menuitem"
                >
                  <User className="text-color-secondary h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{t('Profile')}</span>
                </button>
                <button
                  type="button"
                  className="dropdown-item flex w-full items-center gap-3 px-4 py-2.5"
                  role="menuitem"
                >
                  <Settings className="text-color-secondary h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{t('Settings')}</span>
                </button>
              </div>

              <div className="my-0 h-px bg-[var(--border-color-pro)]" role="separator" />

              {/* Preferences */}
              <div className="py-1" role="none">
                {/* Language sub-menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLangSubmenuOpen(!isLangSubmenuOpen)}
                    className="dropdown-item flex w-full items-center gap-3 px-4 py-2.5"
                    role="menuitem"
                    aria-haspopup="true"
                    aria-expanded={isLangSubmenuOpen}
                  >
                    <Languages className="text-color-secondary h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-medium">{t('Language')}</span>
                    <span className="text-color-secondary ml-auto flex items-center gap-1.5 text-xs">
                      <span aria-hidden="true">{currentLanguage.flag}</span>
                      <span>{currentLanguage.nativeName}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  {isLangSubmenuOpen && (
                    <div
                      className="card-white absolute top-0 right-full z-50 mr-1 w-52 overflow-hidden rounded-lg border shadow-[0_4px_6px_rgba(15,23,42,0.1)]"
                      role="menu"
                      aria-label={t('Select language')}
                    >
                      {LANGUAGES.map((lang) => {
                        const isActive = lang.code === i18n.language
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`dropdown-item flex w-full items-center gap-3 px-4 py-2.5 ${
                              isActive ? 'bg-[var(--active-bg)] text-[var(--primary)]' : ''
                            }`}
                            role="menuitemradio"
                            aria-checked={isActive}
                          >
                            <span aria-hidden="true">{lang.flag}</span>
                            <span className="text-sm font-medium">{lang.nativeName}</span>
                            {isActive && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Theme toggle */}
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="dropdown-item flex w-full items-center gap-3 px-4 py-2.5"
                  role="menuitem"
                  aria-label={t('Toggle theme')}
                >
                  {isDark ? (
                    <Sun className="text-color-secondary h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Moon className="text-color-secondary h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="text-sm font-medium">{isDark ? t('Light') : t('Dark')}</span>
                </button>

                {/* Cache clear (was a destructive toolbar button — buried it) */}
                <button
                  type="button"
                  onClick={clearCache}
                  disabled={isClearingCache}
                  className="dropdown-item flex w-full items-center gap-3 px-4 py-2.5 disabled:opacity-50"
                  role="menuitem"
                >
                  {isClearingCache ? (
                    <Loader2
                      className="h-4 w-4 animate-spin text-[var(--success)]"
                      aria-hidden="true"
                    />
                  ) : (
                    <RefreshCw className="text-color-secondary h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="text-sm font-medium">{t('Clear cache')}</span>
                </button>
              </div>

              <div className="my-0 h-px bg-[var(--border-color-pro)]" role="separator" />

              {/* Sign out */}
              <div className="overflow-hidden rounded-b-lg py-1" role="none">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="dropdown-item-danger flex w-full items-center gap-3 px-4 py-2.5"
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
