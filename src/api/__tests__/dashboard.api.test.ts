/**
 * Tests for Dashboard API Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import apiClient from '@/api/client'
import { getDashboardStats, dashboardApi } from '@/api/dashboard.api'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>

const mockStatsResponse = {
  timestamp: '2025-01-15T10:30:00Z',
  overview: {
    totalStudents: 150000,
    totalTeachers: 12000,
    totalUniversities: 45,
    totalDiplomas: 50000,
    totalProjects: 300,
    totalPublications: 1500,
    activeStudents: 120000,
    graduatedStudents: 20000,
    expelledStudents: 5000,
    academicLeaveStudents: 3000,
    cancelledStudents: 2000,
    grantStudents: 40000,
    contractStudents: 80000,
    maleCount: 70000,
    femaleCount: 50000,
  },
  students: {
    byEducationForm: [
      { name: 'Kunduzgi', count: 100000 },
      { name: 'Sirtqi', count: 20000 },
    ],
    byRegion: [
      { name: 'Toshkent', count: 50000 },
      { name: 'Samarqand', count: 20000 },
    ],
    byLanguage: [
      { name: 'Uzbek', count: 100000 },
      { name: 'Russian', count: 20000 },
    ],
  },
  educationTypes: [
    { code: 'BACHELOR', name: 'Bakalavr', count: 100000 },
    { code: 'MASTER', name: 'Magistr', count: 20000 },
  ],
  topUniversities: [
    {
      rank: 1,
      code: 'TATU',
      name: 'TATU',
      studentCount: 15000,
      maleCount: 10000,
      femaleCount: 5000,
      grantCount: 5000,
      contractCount: 10000,
    },
  ],
  recentActivities: [
    {
      type: 'student',
      action: 'created',
      name: 'Test Student',
      time: '2025-01-15T10:00:00Z',
    },
  ],
}

describe('getDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls the correct endpoint', async () => {
    mockGet.mockResolvedValueOnce({ data: mockStatsResponse })

    await getDashboardStats()

    expect(mockGet).toHaveBeenCalledWith('/api/v1/web/dashboard/stats')
  })

  it('returns the response data', async () => {
    mockGet.mockResolvedValueOnce({ data: mockStatsResponse })

    const result = await getDashboardStats()

    expect(result).toEqual(mockStatsResponse)
    expect(result.overview.totalStudents).toBe(150000)
    expect(result.overview.totalUniversities).toBe(45)
  })

  it('propagates errors from apiClient', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))

    await expect(getDashboardStats()).rejects.toThrow('Network error')
  })
})

describe('dashboardApi.getStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is an alias for getDashboardStats', () => {
    expect(dashboardApi.getStats).toBe(getDashboardStats)
  })

  it('calls the same endpoint as getDashboardStats', async () => {
    mockGet.mockResolvedValueOnce({ data: mockStatsResponse })

    const result = await dashboardApi.getStats()

    expect(mockGet).toHaveBeenCalledWith('/api/v1/web/dashboard/stats')
    expect(result).toEqual(mockStatsResponse)
  })
})
