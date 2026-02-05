/**
 * Tests for useMenu hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMenu } from '@/hooks/useMenu'
import type { MenuResponse } from '@/api/menu.api'

// Mock the API module
vi.mock('@/api/menu.api', () => ({
  getUserMenu: vi.fn(),
}))

// Mock queryKeys
vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    menu: {
      all: ['menu'],
      tree: (locale: string) => ['menu', 'tree', locale],
    },
  },
}))

import { getUserMenu } from '@/api/menu.api'

const mockGetUserMenu = getUserMenu as ReturnType<typeof vi.fn>

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

const mockMenuResponse: MenuResponse = {
  menu: [
    {
      id: '1',
      label: 'Dashboard',
      labelUz: 'Bosh sahifa',
      labelOz: 'Bosh sahifa',
      labelRu: 'Glavnaya',
      labelEn: 'Dashboard',
      url: '/dashboard',
      icon: 'home',
      active: true,
    },
    {
      id: '2',
      label: 'Students',
      labelUz: 'Talabalar',
      labelOz: 'Talabalar',
      labelRu: 'Studenty',
      labelEn: 'Students',
      url: '/students',
      icon: 'users',
      active: true,
    },
  ],
  permissions: ['VIEW_DASHBOARD', 'VIEW_STUDENTS'],
  locale: 'uz-UZ',
}

describe('useMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns query with correct queryKey containing locale', async () => {
    mockGetUserMenu.mockResolvedValueOnce(mockMenuResponse)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useMenu('uz-UZ'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockMenuResponse)
    expect(mockGetUserMenu).toHaveBeenCalledWith('uz-UZ')
  })

  it('calls getUserMenu with the provided locale', async () => {
    mockGetUserMenu.mockResolvedValueOnce(mockMenuResponse)
    const { wrapper } = createWrapper()

    renderHook(() => useMenu('ru-RU'), { wrapper })

    await waitFor(() => expect(mockGetUserMenu).toHaveBeenCalledWith('ru-RU'))
  })

  it('does not fetch when enabled is false', async () => {
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useMenu('uz-UZ', false), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetUserMenu).not.toHaveBeenCalled()
  })

  it('handles API error', async () => {
    mockGetUserMenu.mockRejectedValueOnce(new Error('Unauthorized'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useMenu('uz-UZ'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 10000 })

    expect(result.current.error?.message).toBe('Unauthorized')
  })

  it('returns menu items from the response', async () => {
    mockGetUserMenu.mockResolvedValueOnce(mockMenuResponse)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useMenu('uz-UZ'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.menu).toHaveLength(2)
    expect(result.current.data?.permissions).toContain('VIEW_DASHBOARD')
  })
})
