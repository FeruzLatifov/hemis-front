/**
 * Main Layout Component
 *
 * Clean professional design - no gradients, no glass effects
 * Includes CommandPalette for Ctrl+K search
 */

import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import Breadcrumb from './Breadcrumb'
import CommandPalette from '../CommandPalette'
import { SkipLink } from '../SkipLink'
import { useMenuInit } from '@/hooks/useMenuInit'

// Wide data-table pages that use the FULL available width instead of the 1600px readability cap.
// They stay responsive — filling any screen and scrolling horizontally when it gets too narrow.
// (useLocation, not useMatches/handle: useMatches is data-router-only and breaks component-router tests.)
const FULL_WIDTH_PREFIXES = ['/institutions/speciality-attachments']

export default function MainLayout() {
  // Load menu items — only for authenticated users
  useMenuInit()

  // Wide data-table routes opt out of the 1600px readability cap and use the full width.
  const { pathname } = useLocation()
  const fullWidth = FULL_WIDTH_PREFIXES.some((p) => pathname.startsWith(p))

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
      <SkipLink targetId="main-content" />

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <Breadcrumb />

        <main id="main-content" className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6" tabIndex={-1}>
          {/* Cap content width so tables/dashboards don't stretch edge-to-edge on ultrawide
              monitors; forms keep their own inner max-w and stay centered. Routes flagged
              handle.fullWidth (wide data tables) opt out and use the full available width. */}
          <div className={fullWidth ? 'w-full' : 'mx-auto w-full max-w-[1600px]'}>
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette />
    </div>
  )
}
