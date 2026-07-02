/**
 * Tests for useAttachedSpecialities hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

// Mock i18n config
vi.mock('@/i18n/config', () => ({
  default: { t: (key: string) => key, language: 'uz' },
}))

vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

// Mock queryKeys
vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    attachedSpecialities: {
      all: ['attached-specialities'],
      list: (filters?: Record<string, unknown>) => ['attached-specialities', 'list', filters],
      byId: (id: string) => ['attached-specialities', id],
      dictionaries: ['attached-specialities', 'dictionaries'],
    },
  },
}))

// Mock API
vi.mock('@/api/attachedSpecialities.api', () => ({
  attachedSpecialitiesApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getDictionaries: vi.fn(),
    export: vi.fn(),
  },
}))

import { attachedSpecialitiesApi } from '@/api/attachedSpecialities.api'
import { toast } from 'sonner'
import {
  useAttachedSpecialities,
  useAttachedSpeciality,
  useAttachedSpecialityDictionaries,
  useCreateAttachedSpeciality,
  useUpdateAttachedSpeciality,
  useDeleteAttachedSpeciality,
} from '@/hooks/useAttachedSpecialities'

const mockList = attachedSpecialitiesApi.list as ReturnType<typeof vi.fn>
const mockGetById = attachedSpecialitiesApi.getById as ReturnType<typeof vi.fn>
const mockGetDictionaries = attachedSpecialitiesApi.getDictionaries as ReturnType<typeof vi.fn>
const mockCreate = attachedSpecialitiesApi.create as ReturnType<typeof vi.fn>
const mockUpdate = attachedSpecialitiesApi.update as ReturnType<typeof vi.fn>
const mockRemove = attachedSpecialitiesApi.remove as ReturnType<typeof vi.fn>

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

const mockPage = {
  content: [{ id: 'a1', universityCode: 'U001', universityName: 'Test University' }],
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
}

describe('useAttachedSpecialities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated list data', async () => {
    mockList.mockResolvedValueOnce(mockPage)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useAttachedSpecialities(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPage)
    expect(mockList).toHaveBeenCalledWith({}, expect.any(AbortSignal))
  })

  it('passes params to the API call', async () => {
    mockList.mockResolvedValueOnce(mockPage)
    const { wrapper } = createWrapper()

    const params = { page: 1, size: 20, q: 'soft', universityCode: 'U001' }
    renderHook(() => useAttachedSpecialities(params), { wrapper })

    await waitFor(() => expect(mockList).toHaveBeenCalledWith(params, expect.any(AbortSignal)))
  })

  it('does not fetch detail without an id', () => {
    const { wrapper } = createWrapper()
    renderHook(() => useAttachedSpeciality(null), { wrapper })
    expect(mockGetById).not.toHaveBeenCalled()
  })

  it('fetches dictionaries', async () => {
    mockGetDictionaries.mockResolvedValueOnce({
      universities: [],
      educationTypes: [],
      educationForms: [],
      specialities: { BACHELOR: [], MASTER: [], ORDINATURA: [], DOCTORAL: [] },
    })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useAttachedSpecialityDictionaries(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetDictionaries).toHaveBeenCalled()
  })

  it('creates and shows a success toast', async () => {
    mockCreate.mockResolvedValueOnce({ id: 'a2' })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useCreateAttachedSpeciality(), { wrapper })
    await result.current.mutateAsync({
      universityCode: 'U001',
      educationType: 'ET1',
      educationForm: null,
      specialityLevel: 'BACHELOR',
      specialityId: 's1',
      active: true,
    })

    expect(mockCreate).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Attached speciality created')
  })

  it('updates and shows a success toast', async () => {
    mockUpdate.mockResolvedValueOnce({ id: 'a1' })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateAttachedSpeciality(), { wrapper })
    await result.current.mutateAsync({
      id: 'a1',
      data: {
        universityCode: 'U001',
        educationType: 'ET1',
        educationForm: null,
        specialityLevel: 'BACHELOR',
        specialityId: 's1',
        active: true,
      },
    })

    expect(mockUpdate).toHaveBeenCalledWith('a1', expect.any(Object))
    expect(toast.success).toHaveBeenCalledWith('Attached speciality updated')
  })

  it('deletes and shows a success toast', async () => {
    mockRemove.mockResolvedValueOnce(undefined)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDeleteAttachedSpeciality(), { wrapper })
    await result.current.mutateAsync('a1')

    expect(mockRemove).toHaveBeenCalledWith('a1')
    expect(toast.success).toHaveBeenCalledWith('Attached speciality deleted')
  })
})
