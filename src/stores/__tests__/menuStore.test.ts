import { useMenuStore, useRootMenuItems, useMenuLoading } from '../menuStore'
import type { MenuItem } from '@/api/menu.api'
import { renderHook, act } from '@testing-library/react'

const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    label: 'Dashboard',
    labelUz: 'Bosh sahifa',
    labelOz: 'Бош саҳифа',
    labelRu: 'Главная',
    labelEn: 'Dashboard',
    url: '/dashboard',
    icon: 'home',
  },
  {
    id: '2',
    label: 'Students',
    labelUz: 'Talabalar',
    labelOz: 'Талабалар',
    labelRu: 'Студенты',
    labelEn: 'Students',
    url: '/students',
    icon: 'graduation-cap',
  },
]

describe('menuStore', () => {
  beforeEach(() => {
    useMenuStore.setState({ menuItems: [], isLoading: false })
  })

  describe('setMenuItems', () => {
    it('updates menu items', () => {
      useMenuStore.getState().setMenuItems(mockMenuItems)

      expect(useMenuStore.getState().menuItems).toEqual(mockMenuItems)
      expect(useMenuStore.getState().menuItems).toHaveLength(2)
    })
  })

  describe('setLoading', () => {
    it('sets loading to true', () => {
      useMenuStore.getState().setLoading(true)
      expect(useMenuStore.getState().isLoading).toBe(true)
    })

    it('sets loading to false', () => {
      useMenuStore.getState().setLoading(true)
      useMenuStore.getState().setLoading(false)
      expect(useMenuStore.getState().isLoading).toBe(false)
    })
  })

  describe('clearMenu', () => {
    it('resets menu items and loading', () => {
      useMenuStore.setState({ menuItems: mockMenuItems, isLoading: true })

      useMenuStore.getState().clearMenu()

      expect(useMenuStore.getState().menuItems).toEqual([])
      expect(useMenuStore.getState().isLoading).toBe(false)
    })
  })

  describe('selectors', () => {
    it('useRootMenuItems returns menuItems', () => {
      useMenuStore.setState({ menuItems: mockMenuItems })

      const { result } = renderHook(() => useRootMenuItems())
      expect(result.current).toEqual(mockMenuItems)
    })

    it('useMenuLoading returns isLoading', () => {
      useMenuStore.setState({ isLoading: true })

      const { result } = renderHook(() => useMenuLoading())
      expect(result.current).toBe(true)
    })

    it('useRootMenuItems updates when store changes', () => {
      const { result } = renderHook(() => useRootMenuItems())

      expect(result.current).toEqual([])

      act(() => {
        useMenuStore.getState().setMenuItems(mockMenuItems)
      })

      expect(result.current).toEqual(mockMenuItems)
    })
  })
})
