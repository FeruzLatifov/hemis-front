/**
 * Tests for useFaculties hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock i18n config
vi.mock('@/i18n/config', () => ({
  default: {
    t: (key: string) => key,
    language: 'uz',
  },
}))

// Mock error util
vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: (err: Error, fallback: string) => err?.message || fallback,
}))

// Mock queryKeys
vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    faculties: {
      all: ['faculties'],
      groups: (filters?: Record<string, unknown>) => ['faculty-groups', filters],
      byUniversity: (codes: string[], filters?: Record<string, unknown>) => [
        'faculties-by-university',
        codes,
        filters,
      ],
      byId: (code: string) => ['faculties', code],
    },
  },
}))

// Mock faculties API
vi.mock('@/api/faculties.api', () => ({
  facultiesApi: {
    getGroups: vi.fn(),
    getFacultiesByUniversity: vi.fn(),
    getFacultyDetail: vi.fn(),
    exportFaculties: vi.fn(),
  },
}))

import { facultiesApi } from '@/api/faculties.api'
import { toast } from 'sonner'
import {
  useFacultyGroups,
  useFacultiesByUniversity,
  useFacultyDetail,
  useExportFaculties,
} from '@/hooks/useFaculties'

const mockGetGroups = facultiesApi.getGroups as ReturnType<typeof vi.fn>
const mockGetFacultiesByUniversity = facultiesApi.getFacultiesByUniversity as ReturnType<
  typeof vi.fn
>
const mockGetFacultyDetail = facultiesApi.getFacultyDetail as ReturnType<typeof vi.fn>
const mockExportFaculties = facultiesApi.exportFaculties as ReturnType<typeof vi.fn>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return { wrapper, queryClient }
}

const mockGroupsResponse = {
  content: [
    {
      universityCode: 'TATU',
      universityName: 'TATU',
      facultyCount: 10,
      activeFacultyCount: 8,
      inactiveFacultyCount: 2,
      hasChildren: true,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
}

const mockFacultiesResponse = {
  content: [
    {
      code: 'FAC1',
      nameUz: 'Informatika',
      universityCode: 'TATU',
      universityName: 'TATU',
      status: true,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  size: 50,
  number: 0,
}

const mockFacultyDetail = {
  code: 'FAC1',
  nameUz: 'Informatika fakulteti',
  nameRu: 'Факультет информатики',
  universityCode: 'TATU',
  universityName: 'TATU',
  status: true,
  departmentType: 'FACULTY',
}

describe('useFacultyGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches faculty groups successfully', async () => {
    mockGetGroups.mockResolvedValueOnce(mockGroupsResponse)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useFacultyGroups({ search: '', status: 'all', page: 0 }), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockGroupsResponse)
    expect(mockGetGroups).toHaveBeenCalledWith({
      q: undefined,
      status: undefined,
      page: 0,
      size: 20,
    })
  })

  it('passes search filter', async () => {
    mockGetGroups.mockResolvedValueOnce(mockGroupsResponse)
    const { wrapper } = createWrapper()

    renderHook(() => useFacultyGroups({ search: 'TATU', status: 'true', page: 0 }), { wrapper })

    await waitFor(() =>
      expect(mockGetGroups).toHaveBeenCalledWith({
        q: 'TATU',
        status: true,
        page: 0,
        size: 20,
      }),
    )
  })
})

describe('useFacultiesByUniversity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches faculties for expanded universities', async () => {
    mockGetFacultiesByUniversity.mockResolvedValueOnce(mockFacultiesResponse)
    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useFacultiesByUniversity(['TATU'], { search: '', status: 'all' }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({ TATU: mockFacultiesResponse })
  })

  it('does not fetch when no expanded codes', () => {
    const { wrapper } = createWrapper()

    const { result } = renderHook(
      () => useFacultiesByUniversity([], { search: '', status: 'all' }),
      { wrapper },
    )

    expect(result.current.isFetching).toBe(false)
  })
})

describe('useFacultyDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches faculty detail by code', async () => {
    mockGetFacultyDetail.mockResolvedValueOnce(mockFacultyDetail)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useFacultyDetail('FAC1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockFacultyDetail)
    expect(mockGetFacultyDetail).toHaveBeenCalledWith('FAC1')
  })

  it('does not fetch when code is null', () => {
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useFacultyDetail(null), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetFacultyDetail).not.toHaveBeenCalled()
  })
})

describe('useExportFaculties', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL and related DOM methods
    URL.createObjectURL = vi.fn(() => 'blob:test')
    URL.revokeObjectURL = vi.fn()
  })

  it('downloads excel file on success', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/vnd.ms-excel' })
    mockExportFaculties.mockResolvedValueOnce(mockBlob)
    const { wrapper } = createWrapper()

    // Must spy BEFORE renderHook to avoid DOM container issues
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')

    const { result } = renderHook(() => useExportFaculties(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ q: 'test' })
    })

    expect(mockExportFaculties).toHaveBeenCalledWith({ q: 'test' })
    expect(toast.success).toHaveBeenCalled()

    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('shows error toast on failure', async () => {
    mockExportFaculties.mockRejectedValueOnce(new Error('Export failed'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useExportFaculties(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync({ q: 'test' })
      } catch {
        // Expected
      }
    })

    expect(toast.error).toHaveBeenCalled()
  })
})
