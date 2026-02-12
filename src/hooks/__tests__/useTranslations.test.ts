/**
 * Tests for useTranslations hooks
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
    translations: {
      all: ['translations'],
      list: (filters?: Record<string, unknown>) => ['translations', 'list', filters],
      byId: (id: string) => ['translations', id],
    },
  },
}))

// Mock translations API
vi.mock('@/api/translations.api', () => ({
  getTranslations: vi.fn(),
  getTranslationById: vi.fn(),
  updateTranslation: vi.fn(),
  toggleTranslationActive: vi.fn(),
  clearTranslationCache: vi.fn(),
  regeneratePropertiesFiles: vi.fn(),
  findDuplicateMessages: vi.fn(),
  downloadAllTranslationsAsJson: vi.fn(),
}))

import {
  getTranslations,
  getTranslationById,
  updateTranslation,
  toggleTranslationActive,
  clearTranslationCache,
  regeneratePropertiesFiles,
  findDuplicateMessages,
  downloadAllTranslationsAsJson,
} from '@/api/translations.api'
import { toast } from 'sonner'
import {
  useTranslations,
  useTranslationById,
  useToggleTranslationActive,
  useClearTranslationCache,
  useRegeneratePropertiesFiles,
  useUpdateTranslation,
  useFindDuplicateMessages,
  useDownloadTranslationsAsJson,
} from '@/hooks/useTranslations'

const mockGetTranslations = getTranslations as ReturnType<typeof vi.fn>
const mockGetTranslationById = getTranslationById as ReturnType<typeof vi.fn>
const mockUpdateTranslation = updateTranslation as ReturnType<typeof vi.fn>
const mockToggleActive = toggleTranslationActive as ReturnType<typeof vi.fn>
const mockClearCache = clearTranslationCache as ReturnType<typeof vi.fn>
const mockRegenerate = regeneratePropertiesFiles as ReturnType<typeof vi.fn>
const mockFindDuplicates = findDuplicateMessages as ReturnType<typeof vi.fn>
const mockDownloadJson = downloadAllTranslationsAsJson as ReturnType<typeof vi.fn>

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

const mockListResponse = {
  content: [
    {
      id: '1',
      category: 'action',
      messageKey: 'Save',
      message: 'Saqlash',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ],
  currentPage: 0,
  totalItems: 1,
  totalPages: 1,
  pageSize: 20,
}

const mockTranslation = {
  id: '1',
  category: 'action',
  messageKey: 'Save',
  message: 'Saqlash',
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  translations: [
    { language: 'en-US', translation: 'Save' },
    { language: 'ru-RU', translation: 'Сохранить' },
  ],
}

describe('useTranslations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches translations list', async () => {
    mockGetTranslations.mockResolvedValueOnce(mockListResponse)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useTranslations({ page: 0, size: 20 }), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockListResponse)
  })

  it('passes filters to API', async () => {
    mockGetTranslations.mockResolvedValueOnce(mockListResponse)
    const { wrapper } = createWrapper()

    renderHook(
      () =>
        useTranslations({
          page: 0,
          size: 20,
          category: 'action',
          search: 'Save',
          active: true,
        }),
      { wrapper },
    )

    await waitFor(() =>
      expect(mockGetTranslations).toHaveBeenCalledWith({
        category: 'action',
        search: 'Save',
        active: true,
        page: 0,
        size: 20,
        sortBy: 'category',
        sortDir: 'ASC',
      }),
    )
  })

  it('handles error', async () => {
    mockGetTranslations.mockRejectedValueOnce(new Error('Failed'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useTranslations({ page: 0 }), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useTranslationById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches translation by ID', async () => {
    mockGetTranslationById.mockResolvedValueOnce(mockTranslation)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useTranslationById('1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockTranslation)
  })

  it('does not fetch when id is undefined', () => {
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useTranslationById(undefined), { wrapper })

    expect(result.current.isFetching).toBe(false)
  })
})

describe('useToggleTranslationActive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toggles active status and shows success toast', async () => {
    mockToggleActive.mockResolvedValueOnce({ active: true })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useToggleTranslationActive(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('1')
    })

    expect(mockToggleActive).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Translation activated')
  })

  it('shows deactivation message', async () => {
    mockToggleActive.mockResolvedValueOnce({ active: false })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useToggleTranslationActive(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('1')
    })

    expect(toast.success).toHaveBeenCalledWith('Translation deactivated')
  })

  it('shows error toast on failure', async () => {
    mockToggleActive.mockRejectedValueOnce(new Error('Toggle failed'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useToggleTranslationActive(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync('1')
      } catch {
        // Expected
      }
    })

    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useClearTranslationCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clears cache and shows success toast', async () => {
    mockClearCache.mockResolvedValueOnce({ message: 'Cache cleared' })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useClearTranslationCache(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(mockClearCache).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalled()
  })
})

describe('useRegeneratePropertiesFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('regenerates files and shows success toast', async () => {
    mockRegenerate.mockResolvedValueOnce({
      totalFiles: 4,
      totalTranslations: 479,
    })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useRegeneratePropertiesFiles(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(mockRegenerate).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalled()
  })
})

describe('useUpdateTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates translation and shows success toast', async () => {
    mockUpdateTranslation.mockResolvedValueOnce(mockTranslation)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateTranslation(), { wrapper })

    const data = {
      category: 'action',
      messageKey: 'Save',
      messageUz: 'Saqlash',
    }

    await act(async () => {
      await result.current.mutateAsync({ id: '1', data })
    })

    expect(mockUpdateTranslation).toHaveBeenCalledWith('1', data)
    expect(toast.success).toHaveBeenCalledWith(
      'Translation successfully updated',
      expect.any(Object),
    )
  })

  it('shows error toast on failure', async () => {
    mockUpdateTranslation.mockRejectedValueOnce(new Error('Update failed'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateTranslation(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: '1',
          data: { category: 'action', messageKey: 'Save', messageUz: 'Test' },
        })
      } catch {
        // Expected
      }
    })

    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useFindDuplicateMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('finds duplicates', async () => {
    const mockDuplicates = [
      {
        message: 'Save',
        entries: [
          { id: '1', category: 'action', messageKey: 'Save', message: 'Saqlash', isActive: true },
          { id: '2', category: 'action', messageKey: 'Save2', message: 'Saqlash', isActive: true },
        ],
      },
    ]
    mockFindDuplicates.mockResolvedValueOnce(mockDuplicates)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useFindDuplicateMessages(), { wrapper })

    let data: unknown
    await act(async () => {
      data = await result.current.mutateAsync()
    })

    expect(data).toEqual(mockDuplicates)
  })
})

describe('useDownloadTranslationsAsJson', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('downloads JSON and shows success toast', async () => {
    mockDownloadJson.mockResolvedValueOnce({ downloaded: ['uz', 'ru', 'en', 'oz'] })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDownloadTranslationsAsJson(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(mockDownloadJson).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalled()
  })

  it('shows error toast on failure', async () => {
    mockDownloadJson.mockRejectedValueOnce(new Error('Download failed'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDownloadTranslationsAsJson(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync()
      } catch {
        // Expected
      }
    })

    expect(toast.error).toHaveBeenCalled()
  })
})
