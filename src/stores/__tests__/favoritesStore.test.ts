import { useFavoritesStore, useFavoritesList } from '../favoritesStore'
import type { UserFavorite } from '@/api/favorites.api'
import { renderHook, act } from '@testing-library/react'

const mockFavorites: UserFavorite[] = [
  {
    id: 'f1',
    userId: 'u1',
    menuCode: 'dashboard',
    orderNumber: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'f2',
    userId: 'u1',
    menuCode: 'students',
    orderNumber: 2,
    createdAt: '2024-01-02T00:00:00Z',
  },
]

describe('favoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favorites: [] })
  })

  describe('isFavorite', () => {
    it('returns true for a favorited menu code', () => {
      useFavoritesStore.setState({ favorites: mockFavorites })

      expect(useFavoritesStore.getState().isFavorite('dashboard')).toBe(true)
    })

    it('returns false for a non-favorited menu code', () => {
      useFavoritesStore.setState({ favorites: mockFavorites })

      expect(useFavoritesStore.getState().isFavorite('settings')).toBe(false)
    })

    it('returns false when favorites list is empty', () => {
      expect(useFavoritesStore.getState().isFavorite('dashboard')).toBe(false)
    })
  })

  describe('clearFavorites', () => {
    it('empties the favorites list', () => {
      useFavoritesStore.setState({ favorites: mockFavorites })

      useFavoritesStore.getState().clearFavorites()

      expect(useFavoritesStore.getState().favorites).toEqual([])
    })
  })

  describe('selectors', () => {
    it('useFavoritesList returns favorites array', () => {
      useFavoritesStore.setState({ favorites: mockFavorites })

      const { result } = renderHook(() => useFavoritesList())
      expect(result.current).toEqual(mockFavorites)
    })

    it('useFavoritesList updates when store changes', () => {
      const { result } = renderHook(() => useFavoritesList())

      expect(result.current).toEqual([])

      act(() => {
        useFavoritesStore.setState({ favorites: mockFavorites })
      })

      expect(result.current).toEqual(mockFavorites)
    })
  })
})
