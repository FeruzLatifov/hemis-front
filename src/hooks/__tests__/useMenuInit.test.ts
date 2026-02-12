/**
 * Tests for useMenuInit hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// =====================================================================
// Mocks
// =====================================================================

const mockInvalidateQueries = vi.fn()
const mockRemoveQueries = vi.fn()

// Mock react-i18next
const mockI18nOn = vi.fn()
const mockI18nOff = vi.fn()
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'uz',
      on: mockI18nOn,
      off: mockI18nOff,
    },
    t: (key: string) => key,
  }),
}))

// Mock @tanstack/react-query - useQueryClient
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
      removeQueries: mockRemoveQueries,
    }),
  }
})

// Mock auth store
let mockIsAuthenticated = true
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: mockIsAuthenticated }),
}))

// Mock menu store
const mockSetMenuItems = vi.fn()
const mockClearMenu = vi.fn()
vi.mock('@/stores/menuStore', () => ({
  useMenuStore: (
    selector: (state: {
      setMenuItems: typeof mockSetMenuItems
      clearMenu: typeof mockClearMenu
    }) => unknown,
  ) => selector({ setMenuItems: mockSetMenuItems, clearMenu: mockClearMenu }),
}))

// Mock favorites store
const mockClearFavorites = vi.fn()
vi.mock('@/stores/favoritesStore', () => {
  const store = {
    setState: vi.fn(),
  }
  return {
    useFavoritesStore: Object.assign(
      (selector: (state: { clearFavorites: typeof mockClearFavorites }) => unknown) =>
        selector({ clearFavorites: mockClearFavorites }),
      store,
    ),
  }
})

// Mock useMenu hook
let mockMenuData: { menu: Array<{ id: string; label: string }> } | undefined = undefined
let mockMenuIsLoading = false
let mockMenuError: Error | null = null
vi.mock('@/hooks/useMenu', () => ({
  useMenu: () => ({
    data: mockMenuData,
    isLoading: mockMenuIsLoading,
    error: mockMenuError,
  }),
}))

// Mock useFavorites hook
let mockFavoritesData: Array<{ id: string; menuCode: string }> | undefined = undefined
vi.mock('@/hooks/useFavorites', () => ({
  useFavoritesQuery: () => ({
    data: mockFavoritesData,
  }),
}))

// Mock queryKeys
vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    menu: {
      all: ['menu'],
      tree: (locale: string) => ['menu', 'tree', locale],
    },
    favorites: {
      all: ['favorites'],
      list: ['favorites', 'list'],
    },
  },
}))

// Mock i18n config
vi.mock('@/i18n/config', () => ({
  shortToBcp47: {
    uz: 'uz-UZ',
    oz: 'oz-UZ',
    ru: 'ru-RU',
    en: 'en-US',
  },
  default: {
    language: 'uz',
    on: vi.fn(),
    off: vi.fn(),
  },
}))

import { useMenuInit } from '@/hooks/useMenuInit'
import { useFavoritesStore } from '@/stores/favoritesStore'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function createWrapper() {
  const queryClient = createQueryClient()
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return { wrapper, queryClient }
}

describe('useMenuInit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated = true
    mockMenuData = undefined
    mockMenuIsLoading = false
    mockMenuError = null
    mockFavoritesData = undefined
  })

  it('syncs menu data to menuStore when authenticated and menu data is available', async () => {
    mockMenuData = {
      menu: [
        { id: '1', label: 'Dashboard' },
        { id: '2', label: 'Students' },
      ],
    }

    const { wrapper } = createWrapper()

    renderHook(() => useMenuInit(), { wrapper })

    await waitFor(() => {
      expect(mockSetMenuItems).toHaveBeenCalledWith(mockMenuData!.menu)
    })
  })

  it('clears stores when not authenticated', async () => {
    mockIsAuthenticated = false

    const { wrapper } = createWrapper()

    renderHook(() => useMenuInit(), { wrapper })

    await waitFor(() => {
      expect(mockClearMenu).toHaveBeenCalled()
      expect(mockClearFavorites).toHaveBeenCalled()
      expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ['menu'] })
      expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ['favorites'] })
    })
  })

  it('does not set menu items when not authenticated even if menu data exists', async () => {
    mockIsAuthenticated = false
    mockMenuData = {
      menu: [{ id: '1', label: 'Dashboard' }],
    }

    const { wrapper } = createWrapper()

    renderHook(() => useMenuInit(), { wrapper })

    await waitFor(() => {
      expect(mockClearMenu).toHaveBeenCalled()
    })

    // setMenuItems should not be called because clearMenu runs first (early return)
    // The effect checks isAuthenticated first
    expect(mockSetMenuItems).not.toHaveBeenCalled()
  })

  it('returns isLoading from menu query', () => {
    mockMenuIsLoading = true

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useMenuInit(), { wrapper })

    expect(result.current.isLoading).toBe(true)
  })

  it('returns error message from menu query error', () => {
    mockMenuError = new Error('Failed to load menu')

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useMenuInit(), { wrapper })

    expect(result.current.error).toBe('Failed to load menu')
  })

  it('returns null error when no error exists', () => {
    mockMenuError = null

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useMenuInit(), { wrapper })

    expect(result.current.error).toBeNull()
  })

  it('returns hasMenu true when menu items exist', async () => {
    mockMenuData = {
      menu: [{ id: '1', label: 'Dashboard' }],
    }

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useMenuInit(), { wrapper })

    expect(result.current.hasMenu).toBe(true)
  })

  it('returns hasMenu false when menu is empty', () => {
    mockMenuData = { menu: [] }

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useMenuInit(), { wrapper })

    expect(result.current.hasMenu).toBe(false)
  })

  it('returns hasMenu false when menu data is undefined', () => {
    mockMenuData = undefined

    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useMenuInit(), { wrapper })

    expect(result.current.hasMenu).toBe(false)
  })

  it('syncs favorites data to favoritesStore', async () => {
    mockFavoritesData = [
      { id: '1', menuCode: 'dashboard' },
      { id: '2', menuCode: 'students' },
    ]

    const { wrapper } = createWrapper()

    renderHook(() => useMenuInit(), { wrapper })

    await waitFor(() => {
      expect(useFavoritesStore.setState).toHaveBeenCalledWith({
        favorites: mockFavoritesData,
      })
    })
  })

  it('registers language change listener when authenticated', async () => {
    mockIsAuthenticated = true

    const { wrapper } = createWrapper()

    renderHook(() => useMenuInit(), { wrapper })

    await waitFor(() => {
      expect(mockI18nOn).toHaveBeenCalledWith('languageChanged', expect.any(Function))
    })
  })

  it('does not register language change listener when not authenticated', async () => {
    mockIsAuthenticated = false

    const { wrapper } = createWrapper()

    renderHook(() => useMenuInit(), { wrapper })

    // Give effects time to run
    await waitFor(() => {
      expect(mockClearMenu).toHaveBeenCalled()
    })

    expect(mockI18nOn).not.toHaveBeenCalled()
  })

  it('cleans up language change listener on unmount', async () => {
    mockIsAuthenticated = true

    const { wrapper } = createWrapper()

    const { unmount } = renderHook(() => useMenuInit(), { wrapper })

    await waitFor(() => {
      expect(mockI18nOn).toHaveBeenCalled()
    })

    unmount()

    expect(mockI18nOff).toHaveBeenCalledWith('languageChanged', expect.any(Function))
  })
})
