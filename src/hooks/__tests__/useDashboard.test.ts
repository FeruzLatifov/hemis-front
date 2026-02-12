/**
 * Tests for useDashboard hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock queryKeys
vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    dashboard: {
      stats: ['dashboardStats'],
    },
  },
}))

// Mock dashboard API
vi.mock('@/api/dashboard.api', () => ({
  getDashboardStats: vi.fn(),
}))

import { getDashboardStats } from '@/api/dashboard.api'
import { useDashboardStats } from '@/hooks/useDashboard'

const mockGetDashboardStats = getDashboardStats as ReturnType<typeof vi.fn>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return { wrapper, queryClient }
}

const mockStats = {
  timestamp: '2024-01-01T00:00:00Z',
  overview: {
    totalStudents: 50000,
    totalTeachers: 3000,
    totalUniversities: 80,
    totalDiplomas: 10000,
    totalProjects: 500,
    totalPublications: 2000,
    activeStudents: 40000,
    graduatedStudents: 8000,
    expelledStudents: 500,
    academicLeaveStudents: 300,
    cancelledStudents: 200,
    grantStudents: 15000,
    contractStudents: 25000,
    maleCount: 28000,
    femaleCount: 22000,
  },
  students: {
    byEducationForm: [{ name: 'Kunduzgi', count: 30000 }],
    byRegion: [{ name: 'Toshkent', count: 15000 }],
    byLanguage: [{ name: "O'zbek", count: 35000 }],
  },
  educationTypes: [{ code: 'BACHELOR', name: 'Bakalavr', count: 35000 }],
  topUniversities: [],
  recentActivities: [],
}

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches dashboard stats successfully', async () => {
    mockGetDashboardStats.mockResolvedValueOnce(mockStats)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDashboardStats(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockStats)
    expect(mockGetDashboardStats).toHaveBeenCalledTimes(1)
  })

  it('handles API error', async () => {
    mockGetDashboardStats.mockRejectedValueOnce(new Error('Server error'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDashboardStats(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Server error')
  })

  it('shows loading state initially', () => {
    mockGetDashboardStats.mockReturnValue(new Promise(() => {}))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDashboardStats(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})
