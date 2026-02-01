/**
 * Command Palette Component
 *
 * Quick navigation via Ctrl+K (Cmd+K on Mac)
 * Supports fuzzy search, keyboard navigation, and recent pages
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMenuStore } from '../stores/menuStore'
import { flattenMenuTree } from '../api/menu.api'
import type { MenuItem } from '../api/menu.api'
import { getIcon } from '../utils/iconMapper'

// =====================================================
// Constants
// =====================================================

const RECENT_PAGES_KEY = 'hemis-recent-pages'
const MAX_RECENT_ITEMS = 5

// =====================================================
// Types
// =====================================================

interface RecentPage {
  url: string
  label: string
  icon?: string
  visitedAt: number
}

interface SearchableItem {
  id: string
  label: string
  url: string
  icon?: string
}

// =====================================================
// Helpers
// =====================================================

/**
 * Get label for menu item based on current language
 */
const getMenuLabel = (item: MenuItem, lang: string): string => {
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
 * Simple fuzzy match: checks if all query characters appear in order within the target
 */
const fuzzyMatch = (query: string, target: string): boolean => {
  const lowerQuery = query.toLowerCase()
  const lowerTarget = target.toLowerCase()

  // Exact substring match takes priority
  if (lowerTarget.includes(lowerQuery)) {
    return true
  }

  // Fuzzy: all characters of query appear in order
  let queryIndex = 0
  for (let i = 0; i < lowerTarget.length && queryIndex < lowerQuery.length; i++) {
    if (lowerTarget[i] === lowerQuery[queryIndex]) {
      queryIndex++
    }
  }
  return queryIndex === lowerQuery.length
}

/**
 * Score a fuzzy match (lower is better)
 */
const fuzzyScore = (query: string, target: string): number => {
  const lowerQuery = query.toLowerCase()
  const lowerTarget = target.toLowerCase()

  // Exact match
  if (lowerTarget === lowerQuery) return 0

  // Starts with
  if (lowerTarget.startsWith(lowerQuery)) return 1

  // Contains as substring
  if (lowerTarget.includes(lowerQuery)) return 2

  // Fuzzy match
  return 3
}

/**
 * Load recent pages from localStorage
 */
const loadRecentPages = (): RecentPage[] => {
  try {
    const raw = localStorage.getItem(RECENT_PAGES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentPage[]
    return parsed
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, MAX_RECENT_ITEMS)
  } catch {
    return []
  }
}

/**
 * Save a visited page to recent pages in localStorage
 */
export const addRecentPage = (page: Omit<RecentPage, 'visitedAt'>): void => {
  try {
    const existing = loadRecentPages()
    const filtered = existing.filter((p) => p.url !== page.url)
    const updated: RecentPage[] = [
      { ...page, visitedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS)
    localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(updated))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

// =====================================================
// Component
// =====================================================

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const menuItems = useMenuStore((state) => state.menuItems)

  const currentLang = i18n.language || 'uz'

  // Flatten menu tree into searchable items
  const searchableItems = useMemo((): SearchableItem[] => {
    const flat = flattenMenuTree(menuItems)
    return flat
      .filter((item) => item.url && item.visible !== false)
      .map((item) => ({
        id: item.id,
        label: getMenuLabel(item, currentLang),
        url: item.url!,
        icon: item.icon,
      }))
  }, [menuItems, currentLang])

  // Load recent pages
  const recentPages = useMemo(() => loadRecentPages(), [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return searchableItems

    return searchableItems
      .filter((item) => fuzzyMatch(query, item.label))
      .sort((a, b) => fuzzyScore(query, a.label) - fuzzyScore(query, b.label))
  }, [query, searchableItems])

  // Build the combined list of items for keyboard navigation
  const allItems = useMemo(() => {
    const items: { type: 'recent' | 'page'; url: string; label: string; icon?: string }[] = []

    if (!query.trim()) {
      // Show recent pages section
      recentPages.forEach((page) => {
        items.push({ type: 'recent', url: page.url, label: page.label, icon: page.icon })
      })
    }

    // Show filtered pages
    filteredItems.forEach((item) => {
      items.push({ type: 'page', url: item.url, label: item.label, icon: item.icon })
    })

    return items
  }, [query, recentPages, filteredItems])

  // Reset active index when items change
  useEffect(() => {
    setActiveIndex(0)
  }, [allItems.length])

  // Open/close with Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [isOpen])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  // Navigate to selected item
  const handleSelect = useCallback(
    (url: string, label: string, icon?: string) => {
      addRecentPage({ url, label, icon })
      setIsOpen(false)
      navigate(url)
    },
    [navigate]
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev + 1) % Math.max(allItems.length, 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev - 1 + allItems.length) % Math.max(allItems.length, 1))
          break
        case 'Enter':
          e.preventDefault()
          if (allItems[activeIndex]) {
            const item = allItems[activeIndex]
            handleSelect(item.url, item.label, item.icon)
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          break
      }
    },
    [allItems, activeIndex, handleSelect]
  )

  // Close on overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }, [])

  if (!isOpen) return null

  // Determine if we have recent pages to show
  const hasRecentPages = !query.trim() && recentPages.length > 0
  const hasFilteredItems = filteredItems.length > 0

  // Track current index for data-active across sections
  let itemIndex = -1

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[20vh]"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={t('Tezkor qidiruv')}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-lg border card-white overflow-hidden"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-color-light">
          <Search className="h-4 w-4 text-color-secondary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('Sahifalarni qidirish...')}
            className="w-full py-3 text-sm outline-none bg-transparent text-color-primary placeholder:text-color-secondary"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-color-light px-1.5 text-[10px] font-medium text-color-secondary">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[300px] overflow-y-auto py-2"
          role="listbox"
        >
          {/* Recent Pages Section */}
          {hasRecentPages && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-color-secondary uppercase tracking-wider">
                {t("So'nggi")}
              </div>
              {recentPages.map((page) => {
                itemIndex++
                const currentIndex = itemIndex
                const isActive = activeIndex === currentIndex

                return (
                  <button
                    key={`recent-${page.url}`}
                    data-active={isActive}
                    className={cn(
                      'w-full px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors text-left',
                      isActive ? 'layout-bg' : 'hover:layout-bg'
                    )}
                    onClick={() => handleSelect(page.url, page.label, page.icon)}
                    onMouseEnter={() => setActiveIndex(currentIndex)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <Clock className="h-4 w-4 text-color-secondary shrink-0" />
                    <span className="flex-1 text-sm text-color-primary truncate">
                      {page.label}
                    </span>
                    {isActive && (
                      <ArrowRight className="h-3.5 w-3.5 text-color-secondary shrink-0" />
                    )}
                  </button>
                )
              })}
            </>
          )}

          {/* Divider between sections */}
          {hasRecentPages && hasFilteredItems && (
            <div className="my-1 border-t border-color-light" />
          )}

          {/* All Pages Section */}
          {hasFilteredItems && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-color-secondary uppercase tracking-wider">
                {query.trim() ? t('Natijalar') : t('Barcha sahifalar')}
              </div>
              {filteredItems.map((item) => {
                itemIndex++
                const currentIndex = itemIndex
                const isActive = activeIndex === currentIndex
                const IconComponent = getIcon(item.icon)

                return (
                  <button
                    key={`page-${item.id}`}
                    data-active={isActive}
                    className={cn(
                      'w-full px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors text-left',
                      isActive ? 'layout-bg' : 'hover:layout-bg'
                    )}
                    onClick={() => handleSelect(item.url, item.label, item.icon)}
                    onMouseEnter={() => setActiveIndex(currentIndex)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <IconComponent className="h-4 w-4 text-color-secondary shrink-0" />
                    <span className="flex-1 text-sm text-color-primary truncate">
                      {item.label}
                    </span>
                    {isActive && (
                      <ArrowRight className="h-3.5 w-3.5 text-color-secondary shrink-0" />
                    )}
                  </button>
                )
              })}
            </>
          )}

          {/* Empty State */}
          {!hasRecentPages && !hasFilteredItems && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-color-secondary">
                {t('Natija topilmadi')}
              </p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-color-light">
          <div className="flex items-center gap-1.5 text-xs text-color-secondary">
            <kbd className="inline-flex h-4 items-center rounded border border-color-light px-1 text-[10px] font-medium">
              &uarr;
            </kbd>
            <kbd className="inline-flex h-4 items-center rounded border border-color-light px-1 text-[10px] font-medium">
              &darr;
            </kbd>
            <span>{t('navigatsiya')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-color-secondary">
            <kbd className="inline-flex h-4 items-center rounded border border-color-light px-1 text-[10px] font-medium">
              Enter
            </kbd>
            <span>{t('tanlash')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-color-secondary">
            <kbd className="inline-flex h-4 items-center rounded border border-color-light px-1 text-[10px] font-medium">
              Esc
            </kbd>
            <span>{t('yopish')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
