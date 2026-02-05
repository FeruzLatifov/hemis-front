import apiClient from '@/api/client'
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  reorderFavorites,
} from '@/api/favorites.api'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('favorites.api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── getUserFavorites ──────────────────────────────────────────────

  describe('getUserFavorites', () => {
    it('calls GET on the correct endpoint', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          userId: 'user-1',
          menuCode: 'DASHBOARD',
          orderNumber: 1,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'fav-2',
          userId: 'user-1',
          menuCode: 'UNIVERSITIES',
          orderNumber: 2,
          createdAt: '2024-01-02T00:00:00Z',
        },
      ]

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockFavorites })

      const result = await getUserFavorites()

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/web/favorites')
      expect(apiClient.get).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockFavorites)
      expect(result).toHaveLength(2)
    })

    it('returns empty array when user has no favorites', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] })

      const result = await getUserFavorites()

      expect(result).toEqual([])
    })
  })

  // ─── addFavorite ───────────────────────────────────────────────────

  describe('addFavorite', () => {
    it('calls POST with correct endpoint and menuCode payload', async () => {
      const mockFavorite = {
        id: 'fav-new',
        userId: 'user-1',
        menuCode: 'STUDENTS',
        orderNumber: 3,
        createdAt: '2024-06-15T10:00:00Z',
      }

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockFavorite })

      const result = await addFavorite('STUDENTS')

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/web/favorites', {
        menuCode: 'STUDENTS',
      })
      expect(apiClient.post).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockFavorite)
      expect(result.menuCode).toBe('STUDENTS')
    })
  })

  // ─── removeFavorite ────────────────────────────────────────────────

  describe('removeFavorite', () => {
    it('calls DELETE with correct endpoint including menuCode', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })

      await removeFavorite('DASHBOARD')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/web/favorites/DASHBOARD')
      expect(apiClient.delete).toHaveBeenCalledTimes(1)
    })

    it('handles different menuCode values', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })

      await removeFavorite('UNIVERSITIES')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/web/favorites/UNIVERSITIES')
    })
  })

  // ─── reorderFavorites ──────────────────────────────────────────────

  describe('reorderFavorites', () => {
    it('calls PATCH with correct endpoint and reorder payload', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} })

      const items = [
        { code: 'DASHBOARD', order: 1 },
        { code: 'STUDENTS', order: 2 },
        { code: 'UNIVERSITIES', order: 3 },
      ]

      await reorderFavorites(items)

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/web/favorites/reorder', items)
      expect(apiClient.patch).toHaveBeenCalledTimes(1)
    })

    it('handles empty reorder list', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} })

      await reorderFavorites([])

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/web/favorites/reorder', [])
    })

    it('handles single item reorder', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} })

      const items = [{ code: 'DASHBOARD', order: 1 }]

      await reorderFavorites(items)

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/web/favorites/reorder', items)
    })
  })

  // ─── HTTP method verification ──────────────────────────────────────

  describe('HTTP methods', () => {
    it('getUserFavorites uses GET', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] })
      await getUserFavorites()
      expect(apiClient.get).toHaveBeenCalled()
      expect(apiClient.post).not.toHaveBeenCalled()
      expect(apiClient.delete).not.toHaveBeenCalled()
      expect(apiClient.patch).not.toHaveBeenCalled()
    })

    it('addFavorite uses POST', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} })
      await addFavorite('TEST')
      expect(apiClient.post).toHaveBeenCalled()
      expect(apiClient.get).not.toHaveBeenCalled()
      expect(apiClient.delete).not.toHaveBeenCalled()
      expect(apiClient.patch).not.toHaveBeenCalled()
    })

    it('removeFavorite uses DELETE', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })
      await removeFavorite('TEST')
      expect(apiClient.delete).toHaveBeenCalled()
      expect(apiClient.get).not.toHaveBeenCalled()
      expect(apiClient.post).not.toHaveBeenCalled()
      expect(apiClient.patch).not.toHaveBeenCalled()
    })

    it('reorderFavorites uses PATCH', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} })
      await reorderFavorites([])
      expect(apiClient.patch).toHaveBeenCalled()
      expect(apiClient.get).not.toHaveBeenCalled()
      expect(apiClient.post).not.toHaveBeenCalled()
      expect(apiClient.delete).not.toHaveBeenCalled()
    })
  })
})
