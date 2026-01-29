/**
 * Header Component
 *
 * Clean professional design - no gradients, no glass effects
 * Matches LoginClean.tsx design system
 */

import { Settings, User, LogOut, Bell, Menu, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import LanguageSwitcher from '../common/LanguageSwitcher'
import apiClient from '../../api/client'
import { extractApiErrorMessage } from '../../utils/error.util'

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)
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

  const handleClearCache = async () => {
    setIsClearingCache(true)
    try {
      const response = await apiClient.post('/api/v1/web/auth/cache/clear')
      if (response.data?.success) {
        toast.success('Cache tozalandi', {
          description: 'Permissions va tarjimalar yangilandi. Sahifa qayta yuklanmoqda...',
          duration: 2000,
        })
        // Reload page after short delay to fetch fresh data
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        // ⭐ Backend-driven i18n: Use backend's localized message
        toast.error(response.data?.message || 'Cache tozalashda xatolik yuz berdi')
      }
    } catch (error: unknown) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      const errorMessage = extractApiErrorMessage(error, 'Cache tozalashda xatolik yuz berdi')
      toast.error(errorMessage)
    } finally {
      setIsClearingCache(false)
    }
  }

  return (
    <header
      className="flex h-14 md:h-16 items-center justify-between md:justify-end border-b px-3 md:px-6 card-white"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Left Side - Mobile Menu Button (only on mobile) */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border header-btn"
        aria-label="Menyuni ochish"
      >
        <Menu className="h-5 w-5 text-color-secondary" />
      </button>

      {/* Right Side - Notifications and User Menu */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Notifications Button */}
        <button
          type="button"
          className="relative flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg border header-btn"
          aria-label="Bildirishnomalar (3 ta yangi)"
        >
          <Bell className="h-4 w-4 md:h-5 md:w-5 text-color-secondary" aria-hidden="true" />
          {/* Notification Badge */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full text-xs font-semibold badge-danger" aria-hidden="true">
            3
          </span>
        </button>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Cache Clear Button */}
        <button
          type="button"
          onClick={handleClearCache}
          disabled={isClearingCache}
          className="relative flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg border header-btn header-btn-success disabled:opacity-50"
          title="Cache tozalash (tarjimalar, permissionlar)"
          aria-label="Cache tozalash"
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
            className="flex items-center gap-2 md:gap-3 rounded-lg border px-2 md:px-3 py-1.5 md:py-2 header-btn"
            aria-label="Foydalanuvchi menyusi"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full avatar-primary">
              <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
            </div>

            {/* User Name */}
            <span className="hidden font-medium sm:block text-sm md:text-base text-color-primary">
              {user?.username || 'Admin'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="absolute top-full right-0 mt-2 w-64 rounded-lg border overflow-hidden card-white z-50"
              style={{ boxShadow: '0 4px 6px rgba(15, 23, 42, 0.1)' }}
              role="menu"
              aria-label="Foydalanuvchi menyusi"
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b layout-bg border-color-light">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full avatar-primary">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-color-primary">
                      {user?.username || 'Administrator'}
                    </p>
                    <p className="text-xs text-color-secondary">
                      {user?.email || 'admin@hemis.uz'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1" role="none">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 dropdown-item"
                  role="menuitem"
                >
                  <User className="h-4 w-4 text-color-secondary" aria-hidden="true" />
                  <span className="text-sm font-medium">Profil</span>
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 dropdown-item"
                  role="menuitem"
                >
                  <Settings className="h-4 w-4 text-color-secondary" aria-hidden="true" />
                  <span className="text-sm font-medium">Sozlamalar</span>
                </button>

                <div className="my-1 h-px bg-[var(--border-color-pro)]" role="separator" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 dropdown-item-danger"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">Chiqish</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
