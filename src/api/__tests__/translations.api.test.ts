/**
 * Tests for Translation API Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock apiClient
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
import {
  getTranslations,
  getTranslationById,
  updateTranslation,
  toggleTranslationActive,
  getTranslationStatistics,
  clearTranslationCache,
  exportTranslations,
  regeneratePropertiesFiles,
  findDuplicateMessages,
  searchByMessageText,
  downloadTranslationsAsJson,
} from '@/api/translations.api'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>
const mockPut = apiClient.put as ReturnType<typeof vi.fn>
const mockPatch = apiClient.patch as ReturnType<typeof vi.fn>

describe('getTranslations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls correct endpoint with params', async () => {
    const mockData = {
      content: [
        {
          id: '1',
          category: 'auth',
          messageKey: 'login.title',
          message: 'Kirish',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
      ],
      currentPage: 0,
      totalItems: 1,
      totalPages: 1,
      pageSize: 10,
    }
    mockGet.mockResolvedValueOnce({ data: { data: mockData } })

    const params = { category: 'auth', page: 0, size: 10 }
    const result = await getTranslations(params)

    expect(mockGet).toHaveBeenCalledWith('/api/v1/web/system/translation', { params })
    expect(result.content).toHaveLength(1)
    expect(result.totalItems).toBe(1)
  })

  it('normalizes response with content array only', async () => {
    const items = [
      {
        id: '1',
        category: 'auth',
        messageKey: 'login.title',
        message: 'Kirish',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        category: 'auth',
        messageKey: 'login.submit',
        message: 'Yuborish',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]
    mockGet.mockResolvedValueOnce({ data: { data: { content: items } } })

    const result = await getTranslations()

    expect(result.content).toEqual(items)
    expect(result.currentPage).toBe(0)
    expect(result.totalItems).toBe(2)
    expect(result.totalPages).toBe(1)
    expect(result.pageSize).toBe(2)
  })

  it('normalizes response wrapped in data property', async () => {
    const inner = {
      content: [
        {
          id: '1',
          category: 'common',
          messageKey: 'ok',
          message: 'OK',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
      ],
      currentPage: 0,
      totalItems: 1,
      totalPages: 1,
      pageSize: 10,
    }
    mockGet.mockResolvedValueOnce({ data: { data: inner } })

    const result = await getTranslations()

    expect(result.content).toHaveLength(1)
    expect(result.totalItems).toBe(1)
  })

  it('normalizes paginated object with alternative field names', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          items: [
            {
              id: '1',
              category: 'common',
              messageKey: 'cancel',
              message: 'Bekor',
              isActive: true,
              createdAt: '',
              updatedAt: '',
            },
          ],
          total: 50,
          size: 20,
          page: 2,
        },
      },
    })

    const result = await getTranslations()

    expect(result.content).toHaveLength(1)
    expect(result.totalItems).toBe(50)
    expect(result.pageSize).toBe(20)
    expect(result.currentPage).toBe(2)
    expect(result.totalPages).toBe(3) // ceil(50/20) = 3
  })
})

describe('getTranslationById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls correct endpoint and returns data', async () => {
    const translation = {
      id: '42',
      category: 'auth',
      messageKey: 'login.title',
      message: 'Kirish',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    }
    mockGet.mockResolvedValueOnce({ data: { data: translation } })

    const result = await getTranslationById('42')

    expect(mockGet).toHaveBeenCalledWith('/api/v1/web/system/translation/42')
    expect(result).toEqual(translation)
  })
})

describe('updateTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls PUT with correct URL and body', async () => {
    const updated = {
      id: '42',
      category: 'auth',
      messageKey: 'login.title',
      message: 'Kirish yangilangan',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    }
    mockPut.mockResolvedValueOnce({ data: { data: updated } })

    const updateData = {
      category: 'auth',
      messageKey: 'login.title',
      messageUz: 'Kirish yangilangan',
    }
    const result = await updateTranslation('42', updateData)

    expect(mockPut).toHaveBeenCalledWith('/api/v1/web/system/translation/42', updateData)
    expect(result).toEqual(updated)
  })
})

describe('toggleTranslationActive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls PATCH with correct URL', async () => {
    mockPatch.mockResolvedValueOnce({
      data: { success: true, data: { active: false } },
    })

    const result = await toggleTranslationActive('42')

    expect(mockPatch).toHaveBeenCalledWith('/api/v1/web/system/translation/42/toggle-active')
    expect(result.active).toBe(false)
  })
})

describe('getTranslationStatistics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls correct endpoint and returns statistics', async () => {
    const stats = {
      totalMessages: 100,
      activeMessages: 80,
      inactiveMessages: 20,
      totalTranslations: 400,
      categoryBreakdown: { auth: 30, common: 50, admin: 20 },
      languages: ['uz', 'ru', 'en', 'oz'],
    }
    mockGet.mockResolvedValueOnce({ data: { data: stats } })

    const result = await getTranslationStatistics()

    expect(mockGet).toHaveBeenCalledWith('/api/v1/web/system/translation/stats')
    expect(result).toEqual(stats)
  })
})

describe('clearTranslationCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls POST to clear cache', async () => {
    mockPost.mockResolvedValueOnce({ data: { message: 'Cache cleared' } })

    const result = await clearTranslationCache()

    expect(mockPost).toHaveBeenCalledWith('/api/v1/web/system/translation/cache/clear')
    expect(result).toEqual({ message: 'Cache cleared' })
  })
})

describe('exportTranslations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls POST with language param', async () => {
    const exportData = { 'login.title': 'Kirish', 'login.submit': 'Yuborish' }
    mockPost.mockResolvedValueOnce({ data: { data: { properties: exportData } } })

    const result = await exportTranslations('uz')

    expect(mockPost).toHaveBeenCalledWith('/api/v1/web/system/translation/export', undefined, {
      params: { language: 'uz' },
    })
    expect(result).toEqual(exportData)
  })
})

describe('regeneratePropertiesFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls POST to regenerate properties', async () => {
    const response = {
      success: true,
      generatedFiles: ['uz.properties', 'ru.properties'],
      totalFiles: 2,
      totalTranslations: 100,
      timestamp: '2025-01-01T00:00:00Z',
    }
    mockPost.mockResolvedValueOnce({ data: { data: response } })

    const result = await regeneratePropertiesFiles()

    expect(mockPost).toHaveBeenCalledWith('/api/v1/web/system/translation/properties/regenerate')
    expect(result).toEqual(response)
  })
})

describe('findDuplicateMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('groups duplicate messages correctly', async () => {
    const translations = [
      {
        id: '1',
        category: 'auth',
        messageKey: 'login.title',
        message: 'Kirish',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        category: 'common',
        messageKey: 'enter',
        message: 'Kirish',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '3',
        category: 'common',
        messageKey: 'ok',
        message: 'OK',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '4',
        category: 'nav',
        messageKey: 'nav.enter',
        message: 'kirish',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]

    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          content: translations,
          currentPage: 0,
          totalItems: 4,
          totalPages: 1,
          pageSize: 5000,
        },
      },
    })

    const result = await findDuplicateMessages()

    // 'Kirish', 'kirish' and 'kirish' all normalize to 'kirish' -> 3 entries in 1 group
    expect(result).toHaveLength(1)
    expect(result[0].entries).toHaveLength(3)
  })

  it('sorts duplicates by count (most duplicates first)', async () => {
    const translations = [
      {
        id: '1',
        category: 'a',
        messageKey: 'a1',
        message: 'Hello',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        category: 'b',
        messageKey: 'b1',
        message: 'Hello',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '3',
        category: 'a',
        messageKey: 'a2',
        message: 'World',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '4',
        category: 'b',
        messageKey: 'b2',
        message: 'World',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '5',
        category: 'c',
        messageKey: 'c1',
        message: 'world',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]

    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          content: translations,
          currentPage: 0,
          totalItems: 5,
          totalPages: 1,
          pageSize: 5000,
        },
      },
    })

    const result = await findDuplicateMessages()

    // 'world' group has 3 entries, 'hello' group has 2
    expect(result).toHaveLength(2)
    expect(result[0].entries.length).toBeGreaterThanOrEqual(result[1].entries.length)
  })

  it('returns empty array when no duplicates exist', async () => {
    const translations = [
      {
        id: '1',
        category: 'a',
        messageKey: 'a1',
        message: 'Unique1',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        category: 'b',
        messageKey: 'b1',
        message: 'Unique2',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]

    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          content: translations,
          currentPage: 0,
          totalItems: 2,
          totalPages: 1,
          pageSize: 5000,
        },
      },
    })

    const result = await findDuplicateMessages()
    expect(result).toEqual([])
  })
})

describe('searchByMessageText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array for short queries (less than 3 chars)', async () => {
    const result = await searchByMessageText('ab')
    expect(result).toEqual([])
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('returns empty array for empty string', async () => {
    const result = await searchByMessageText('')
    expect(result).toEqual([])
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('calls getTranslations with search param for valid queries', async () => {
    const translations = [
      {
        id: '1',
        category: 'auth',
        messageKey: 'login.title',
        message: 'Kirish',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]

    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          content: translations,
          currentPage: 0,
          totalItems: 1,
          totalPages: 1,
          pageSize: 10,
        },
      },
    })

    const result = await searchByMessageText('Kirish')

    expect(mockGet).toHaveBeenCalledWith('/api/v1/web/system/translation', {
      params: { search: 'Kirish', size: 10 },
    })
    expect(result).toEqual(translations)
  })

  it('trims whitespace from search text', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          content: [],
          currentPage: 0,
          totalItems: 0,
          totalPages: 1,
          pageSize: 10,
        },
      },
    })

    await searchByMessageText('  Kirish  ')

    expect(mockGet).toHaveBeenCalledWith('/api/v1/web/system/translation', {
      params: { search: 'Kirish', size: 10 },
    })
  })
})

describe('downloadTranslationsAsJson', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates nested object from flat keys and triggers download', async () => {
    const exportData = {
      'login.title': 'Kirish',
      'login.submit': 'Yuborish',
      'common.ok': 'OK',
      simple: 'Oddiy',
    }
    mockPost.mockResolvedValueOnce({ data: { data: { properties: exportData } } })

    // Mock DOM methods
    const mockClick = vi.fn()
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockLink as unknown as HTMLElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockLink as unknown as HTMLElement,
    )
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      () => mockLink as unknown as HTMLElement,
    )

    const mockBlobUrl = 'blob:http://localhost/test-blob'
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce(mockBlobUrl)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    await downloadTranslationsAsJson('uz')

    // Verify export was called
    expect(mockPost).toHaveBeenCalledWith('/api/v1/web/system/translation/export', undefined, {
      params: { language: 'uz' },
    })

    // Verify link was created with correct download name
    expect(mockLink.download).toBe('uz.json')
    expect(mockLink.href).toBe(mockBlobUrl)
    expect(mockClick).toHaveBeenCalled()

    // Verify blob URL was revoked
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockBlobUrl)
  })
})
