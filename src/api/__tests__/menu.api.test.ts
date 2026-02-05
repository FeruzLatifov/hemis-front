import apiClient from '@/api/client'
import { getUserMenu, flattenMenuTree } from '@/api/menu.api'
import type { MenuItem } from '@/api/menu.api'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'item-1',
    label: 'Dashboard',
    labelUz: 'Bosh sahifa',
    labelOz: 'Bош саhифа',
    labelRu: 'Главная',
    labelEn: 'Dashboard',
    ...overrides,
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('menu.api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── getUserMenu ───────────────────────────────────────────────────

  describe('getUserMenu', () => {
    it('calls correct endpoint with default locale', async () => {
      const mockResponse = {
        menu: [makeMenuItem()],
        permissions: ['VIEW_DASHBOARD'],
        locale: 'uz-UZ',
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await getUserMenu()

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/web/menu?locale=uz-UZ')
      expect(result).toEqual(mockResponse)
      expect(result.menu).toHaveLength(1)
      expect(result.permissions).toContain('VIEW_DASHBOARD')
      expect(result.locale).toBe('uz-UZ')
    })

    it('calls correct endpoint with custom locale', async () => {
      const mockResponse = {
        menu: [makeMenuItem({ label: 'Главная' })],
        permissions: ['VIEW_DASHBOARD'],
        locale: 'ru-RU',
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await getUserMenu('ru-RU')

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/web/menu?locale=ru-RU')
      expect(result.locale).toBe('ru-RU')
    })

    it('returns the full menu response including meta', async () => {
      const mockResponse = {
        menu: [],
        permissions: [],
        locale: 'uz-UZ',
        _meta: {
          cached: true,
          cacheExpiresAt: 1700000000,
          generatedAt: '2024-01-01T00:00:00Z',
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse })

      const result = await getUserMenu()

      expect(result._meta).toBeDefined()
      expect(result._meta?.cached).toBe(true)
    })
  })

  // ─── flattenMenuTree ───────────────────────────────────────────────

  describe('flattenMenuTree', () => {
    it('returns empty array for empty input', () => {
      const result = flattenMenuTree([])
      expect(result).toEqual([])
    })

    it('returns flat list for items without children', () => {
      const items: MenuItem[] = [
        makeMenuItem({ id: 'a', label: 'A' }),
        makeMenuItem({ id: 'b', label: 'B' }),
        makeMenuItem({ id: 'c', label: 'C' }),
      ]

      const result = flattenMenuTree(items)

      expect(result).toHaveLength(3)
      expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    })

    it('flattens nested menu items (one level deep)', () => {
      const items: MenuItem[] = [
        makeMenuItem({
          id: 'parent',
          label: 'Parent',
          items: [
            makeMenuItem({ id: 'child-1', label: 'Child 1' }),
            makeMenuItem({ id: 'child-2', label: 'Child 2' }),
          ],
        }),
      ]

      const result = flattenMenuTree(items)

      expect(result).toHaveLength(3)
      expect(result.map((i) => i.id)).toEqual(['parent', 'child-1', 'child-2'])
    })

    it('flattens deeply nested items (3 levels)', () => {
      const items: MenuItem[] = [
        makeMenuItem({
          id: 'level-0',
          label: 'Level 0',
          items: [
            makeMenuItem({
              id: 'level-1',
              label: 'Level 1',
              items: [
                makeMenuItem({
                  id: 'level-2',
                  label: 'Level 2',
                  items: [makeMenuItem({ id: 'level-3', label: 'Level 3' })],
                }),
              ],
            }),
          ],
        }),
      ]

      const result = flattenMenuTree(items)

      expect(result).toHaveLength(4)
      expect(result.map((i) => i.id)).toEqual(['level-0', 'level-1', 'level-2', 'level-3'])
    })

    it('handles mixed items (some with children, some without)', () => {
      const items: MenuItem[] = [
        makeMenuItem({ id: 'flat-1', label: 'Flat 1' }),
        makeMenuItem({
          id: 'parent',
          label: 'Parent',
          items: [makeMenuItem({ id: 'child', label: 'Child' })],
        }),
        makeMenuItem({ id: 'flat-2', label: 'Flat 2' }),
      ]

      const result = flattenMenuTree(items)

      expect(result).toHaveLength(4)
      expect(result.map((i) => i.id)).toEqual(['flat-1', 'parent', 'child', 'flat-2'])
    })

    it('handles items with empty children array', () => {
      const items: MenuItem[] = [makeMenuItem({ id: 'empty-children', label: 'Empty', items: [] })]

      const result = flattenMenuTree(items)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('empty-children')
    })

    it('preserves all properties of menu items', () => {
      const items: MenuItem[] = [
        makeMenuItem({
          id: 'full',
          label: 'Full Item',
          i18nKey: 'menu.full',
          url: '/full',
          icon: 'home',
          permission: 'VIEW_FULL',
          active: true,
          visible: true,
          order: 1,
          orderNum: 1,
        }),
      ]

      const result = flattenMenuTree(items)

      expect(result[0]).toMatchObject({
        id: 'full',
        label: 'Full Item',
        i18nKey: 'menu.full',
        url: '/full',
        icon: 'home',
        permission: 'VIEW_FULL',
        active: true,
        visible: true,
        order: 1,
        orderNum: 1,
      })
    })
  })
})
