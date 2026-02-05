/**
 * Main Layout Component
 *
 * Clean professional design - no gradients, no glass effects
 * Includes CommandPalette for Ctrl+K search
 */

import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './Header'
import Sidebar from './Sidebar'
import Breadcrumb from './Breadcrumb'
import CommandPalette from '../CommandPalette'
import { useMenuInit } from '@/hooks/useMenuInit'

export default function MainLayout() {
  const { t } = useTranslation()
  // Load menu items — only for authenticated users
  useMenuInit()

  // Default open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768
    }
    return true
  })

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="layout-bg flex h-screen overflow-hidden">
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        {t('Skip to content')}
      </a>

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <Breadcrumb />

        <main id="main-content" className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <CommandPalette />
    </div>
  )
}
