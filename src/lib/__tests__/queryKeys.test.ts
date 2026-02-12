import { queryKeys } from '@/lib/queryKeys'

describe('queryKeys', () => {
  // ─── universities ──────────────────────────────────────────────────

  describe('universities', () => {
    it('all returns correct key', () => {
      expect(queryKeys.universities.all).toEqual(['universities'])
    })

    it('list returns correct key with filters', () => {
      const filters = { page: 0, size: 20, q: 'TATU' }
      expect(queryKeys.universities.list(filters)).toEqual(['universities', 'list', filters])
    })

    it('list returns correct key without filters', () => {
      expect(queryKeys.universities.list()).toEqual(['universities', 'list', undefined])
    })

    it('byId returns correct key with id', () => {
      expect(queryKeys.universities.byId('TATU')).toEqual(['universities', 'TATU'])
    })

    it('faculties returns correct key with id', () => {
      expect(queryKeys.universities.faculties('TATU')).toEqual([
        'universities',
        'TATU',
        'faculties',
      ])
    })

    it('dictionaries returns correct key', () => {
      expect(queryKeys.universities.dictionaries).toEqual(['universities', 'dictionaries'])
    })
  })

  // ─── translations ──────────────────────────────────────────────────

  describe('translations', () => {
    it('all returns correct key', () => {
      expect(queryKeys.translations.all).toEqual(['translations'])
    })

    it('list returns correct key with filters', () => {
      const filters = { lang: 'uz', page: 1 }
      expect(queryKeys.translations.list(filters)).toEqual(['translations', 'list', filters])
    })

    it('list returns correct key without filters', () => {
      expect(queryKeys.translations.list()).toEqual(['translations', 'list', undefined])
    })

    it('byId returns correct key with id', () => {
      expect(queryKeys.translations.byId('welcome-msg')).toEqual(['translations', 'welcome-msg'])
    })
  })

  // ─── faculties ─────────────────────────────────────────────────────

  describe('faculties', () => {
    it('all returns correct key', () => {
      expect(queryKeys.faculties.all).toEqual(['faculties'])
    })

    it('groups returns correct key with filters', () => {
      const filters = { page: 0, size: 10 }
      expect(queryKeys.faculties.groups(filters)).toEqual(['faculty-groups', filters])
    })

    it('groups returns correct key without filters', () => {
      expect(queryKeys.faculties.groups()).toEqual(['faculty-groups', undefined])
    })

    it('byUniversity returns correct key with codes and filters', () => {
      const codes = ['TATU', 'TDTU']
      const filters = { active: true }
      expect(queryKeys.faculties.byUniversity(codes, filters)).toEqual([
        'faculties-by-university',
        codes,
        filters,
      ])
    })

    it('byUniversity returns correct key without filters', () => {
      const codes = ['TATU']
      expect(queryKeys.faculties.byUniversity(codes)).toEqual([
        'faculties-by-university',
        codes,
        undefined,
      ])
    })
  })

  // ─── dashboard ─────────────────────────────────────────────────────

  describe('dashboard', () => {
    it('stats returns correct key', () => {
      expect(queryKeys.dashboard.stats).toEqual(['dashboardStats'])
    })
  })

  // ─── menu ──────────────────────────────────────────────────────────

  describe('menu', () => {
    it('all returns correct key', () => {
      expect(queryKeys.menu.all).toEqual(['menu'])
    })

    it('tree returns correct key with locale', () => {
      expect(queryKeys.menu.tree('uz-UZ')).toEqual(['menu', 'tree', 'uz-UZ'])
    })

    it('tree returns different keys for different locales', () => {
      const uzKey = queryKeys.menu.tree('uz-UZ')
      const ruKey = queryKeys.menu.tree('ru-RU')
      expect(uzKey).not.toEqual(ruKey)
      expect(uzKey[2]).toBe('uz-UZ')
      expect(ruKey[2]).toBe('ru-RU')
    })
  })

  // ─── favorites ─────────────────────────────────────────────────────

  describe('favorites', () => {
    it('all returns correct key', () => {
      expect(queryKeys.favorites.all).toEqual(['favorites'])
    })

    it('list returns correct key', () => {
      expect(queryKeys.favorites.list).toEqual(['favorites', 'list'])
    })
  })

  // ─── Key uniqueness ────────────────────────────────────────────────

  describe('key uniqueness', () => {
    it('static keys are all unique', () => {
      const staticKeys = [
        queryKeys.universities.all,
        queryKeys.universities.dictionaries,
        queryKeys.translations.all,
        queryKeys.faculties.all,
        queryKeys.dashboard.stats,
        queryKeys.menu.all,
        queryKeys.favorites.all,
        queryKeys.favorites.list,
      ]

      const serialized = staticKeys.map((k) => JSON.stringify(k))
      const unique = new Set(serialized)

      expect(unique.size).toBe(staticKeys.length)
    })

    it('function keys with same params produce consistent results', () => {
      const filters = { page: 1 }

      const key1 = queryKeys.universities.list(filters)
      const key2 = queryKeys.universities.list(filters)

      expect(key1).toEqual(key2)
    })

    it('function keys with different params produce different results', () => {
      const key1 = queryKeys.universities.byId('TATU')
      const key2 = queryKeys.universities.byId('TDTU')

      expect(key1).not.toEqual(key2)
    })

    it('keys from different domains are unique', () => {
      // universities.all and translations.all should be different
      expect(JSON.stringify(queryKeys.universities.all)).not.toBe(
        JSON.stringify(queryKeys.translations.all),
      )

      // universities.all and faculties.all should be different
      expect(JSON.stringify(queryKeys.universities.all)).not.toBe(
        JSON.stringify(queryKeys.faculties.all),
      )

      // menu.all and favorites.all should be different
      expect(JSON.stringify(queryKeys.menu.all)).not.toBe(JSON.stringify(queryKeys.favorites.all))
    })

    it('list keys from different domains do not collide', () => {
      const uniList = queryKeys.universities.list({ page: 0 })
      const transLit = queryKeys.translations.list({ page: 0 })

      expect(JSON.stringify(uniList)).not.toBe(JSON.stringify(transLit))
    })
  })

  // ─── Readonly guarantee ────────────────────────────────────────────

  describe('readonly arrays (as const)', () => {
    it('static keys are readonly arrays', () => {
      // Verify they are arrays (runtime check; readonly is compile-time only)
      expect(Array.isArray(queryKeys.universities.all)).toBe(true)
      expect(Array.isArray(queryKeys.universities.dictionaries)).toBe(true)
      expect(Array.isArray(queryKeys.dashboard.stats)).toBe(true)
      expect(Array.isArray(queryKeys.menu.all)).toBe(true)
      expect(Array.isArray(queryKeys.favorites.all)).toBe(true)
      expect(Array.isArray(queryKeys.favorites.list)).toBe(true)
    })

    it('function keys return arrays', () => {
      expect(Array.isArray(queryKeys.universities.list())).toBe(true)
      expect(Array.isArray(queryKeys.universities.byId('x'))).toBe(true)
      expect(Array.isArray(queryKeys.universities.faculties('x'))).toBe(true)
      expect(Array.isArray(queryKeys.translations.list())).toBe(true)
      expect(Array.isArray(queryKeys.translations.byId('x'))).toBe(true)
      expect(Array.isArray(queryKeys.faculties.groups())).toBe(true)
      expect(Array.isArray(queryKeys.faculties.byUniversity([]))).toBe(true)
      expect(Array.isArray(queryKeys.menu.tree('uz-UZ'))).toBe(true)
    })
  })
})
