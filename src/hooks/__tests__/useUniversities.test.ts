/**
 * Tests for useUniversities hooks
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
    info: vi.fn(),
  },
}))

// Mock i18n config
vi.mock('@/i18n/config', () => ({
  default: {
    t: (key: string) => key,
    language: 'uz',
  },
}))

// Mock queryKeys
vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    universities: {
      all: ['universities'],
      list: (filters?: Record<string, unknown>) => ['universities', 'list', filters],
      byId: (id: string) => ['universities', id],
      dictionaries: ['universities', 'dictionaries'],
    },
  },
}))

// Mock universities API
vi.mock('@/api/universities.api', () => ({
  universitiesApi: {
    getUniversities: vi.fn(),
    getUniversity: vi.fn(),
    getDictionaries: vi.fn(),
    createUniversity: vi.fn(),
    updateUniversity: vi.fn(),
    deleteUniversity: vi.fn(),
    exportUniversities: vi.fn(),
  },
}))

import { universitiesApi } from '@/api/universities.api'
import { toast } from 'sonner'
import {
  useUniversities,
  useUniversity,
  useUniversityDictionaries,
  useCreateUniversity,
  useUpdateUniversity,
  useDeleteUniversity,
} from '@/hooks/useUniversities'

const mockGetUniversities = universitiesApi.getUniversities as ReturnType<typeof vi.fn>
const mockGetUniversity = universitiesApi.getUniversity as ReturnType<typeof vi.fn>
const mockGetDictionaries = universitiesApi.getDictionaries as ReturnType<typeof vi.fn>
const mockCreateUniversity = universitiesApi.createUniversity as ReturnType<typeof vi.fn>
const mockUpdateUniversity = universitiesApi.updateUniversity as ReturnType<typeof vi.fn>
const mockDeleteUniversity = universitiesApi.deleteUniversity as ReturnType<typeof vi.fn>

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

const mockPagedResponse = {
  content: [
    { code: 'TATU', name: 'TATU', active: true },
    { code: 'TDTU', name: 'TDTU', active: true },
  ],
  totalElements: 2,
  totalPages: 1,
  size: 10,
  number: 0,
}

const mockUniversityDetail = {
  code: 'TATU',
  name: 'Toshkent Axborot Texnologiyalari Universiteti',
  tin: '123456789',
  active: true,
}

const mockDictionaries = {
  ownerships: [{ code: 'STATE', name: 'Davlat' }],
  types: [{ code: 'UNIVERSITY', name: 'Universitet' }],
  regions: [{ code: 'TOSHKENT', name: 'Toshkent' }],
}

describe('useUniversities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns query with universities data', async () => {
    mockGetUniversities.mockResolvedValueOnce(mockPagedResponse)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUniversities(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockPagedResponse)
    expect(mockGetUniversities).toHaveBeenCalledWith({})
  })

  it('passes params to API call', async () => {
    mockGetUniversities.mockResolvedValueOnce(mockPagedResponse)
    const { wrapper } = createWrapper()

    const params = { page: 1, size: 20, q: 'TATU' }
    renderHook(() => useUniversities(params), { wrapper })

    await waitFor(() => expect(mockGetUniversities).toHaveBeenCalledWith(params))
  })

  it('handles API error', async () => {
    mockGetUniversities.mockRejectedValueOnce(new Error('Server error'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUniversities(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Server error')
  })
})

describe('useUniversity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches university when code exists', async () => {
    mockGetUniversity.mockResolvedValueOnce(mockUniversityDetail)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUniversity('TATU'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockUniversityDetail)
    expect(mockGetUniversity).toHaveBeenCalledWith('TATU')
  })

  it('does not fetch when code is empty string', async () => {
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUniversity(''), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockGetUniversity).not.toHaveBeenCalled()
  })
})

describe('useUniversityDictionaries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches dictionaries', async () => {
    mockGetDictionaries.mockResolvedValueOnce(mockDictionaries)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUniversityDictionaries(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockDictionaries)
    expect(mockGetDictionaries).toHaveBeenCalled()
  })
})

describe('useCreateUniversity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls createUniversity and shows success toast', async () => {
    const createdUniversity = { code: 'NEW', name: 'New University', active: true }
    mockCreateUniversity.mockResolvedValueOnce(createdUniversity)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useCreateUniversity(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ code: 'NEW', name: 'New University' })
    })

    expect(mockCreateUniversity).toHaveBeenCalledWith({ code: 'NEW', name: 'New University' })
    expect(toast.success).toHaveBeenCalledWith('University successfully created')
  })

  it('shows error toast on failure', async () => {
    mockCreateUniversity.mockRejectedValueOnce(new Error('Duplicate code'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useCreateUniversity(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync({ code: 'TATU', name: 'Duplicate' })
      } catch {
        // Expected
      }
    })

    expect(toast.error).toHaveBeenCalledWith('Error: Duplicate code')
  })
})

describe('useUpdateUniversity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls updateUniversity and shows success toast', async () => {
    const updatedUniversity = { code: 'TATU', name: 'Updated TATU', active: true }
    mockUpdateUniversity.mockResolvedValueOnce(updatedUniversity)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateUniversity(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ code: 'TATU', data: { name: 'Updated TATU' } })
    })

    expect(mockUpdateUniversity).toHaveBeenCalledWith('TATU', { name: 'Updated TATU' })
    expect(toast.success).toHaveBeenCalledWith('University successfully updated')
  })

  it('shows error toast on failure', async () => {
    mockUpdateUniversity.mockRejectedValueOnce(new Error('Not found'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateUniversity(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync({ code: 'MISSING', data: { name: 'Test' } })
      } catch {
        // Expected
      }
    })

    expect(toast.error).toHaveBeenCalledWith('Error: Not found')
  })
})

describe('useDeleteUniversity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls deleteUniversity and shows success toast', async () => {
    mockDeleteUniversity.mockResolvedValueOnce(undefined)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDeleteUniversity(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('TATU')
    })

    expect(mockDeleteUniversity).toHaveBeenCalledWith('TATU')
    expect(toast.success).toHaveBeenCalledWith('University successfully deleted')
  })

  it('shows error toast on failure', async () => {
    mockDeleteUniversity.mockRejectedValueOnce(new Error('Cannot delete'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDeleteUniversity(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync('TATU')
      } catch {
        // Expected
      }
    })

    expect(toast.error).toHaveBeenCalledWith('Error: Cannot delete')
  })
})
