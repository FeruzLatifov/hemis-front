import { useAuthStore } from '../authStore'
import * as authApi from '@/api/auth.api'
import type { LoginResponse } from '@/types/auth.types'

// Mock authApi module
vi.mock('@/api/auth.api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn(),
}))

const mockLoginResponse: LoginResponse = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@hemis.uz',
    name: 'Test User',
    locale: 'uz',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  university: {
    id: 'u1',
    code: 'TATU',
    name: { uz: 'TATU', ru: 'TATU', en: 'TATU' },
    active: true,
  },
  permissions: ['VIEW_DASHBOARD', 'MANAGE_USERS'],
}

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      university: null,
      permissions: [],
      isAuthenticated: false,
    })
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('initial state', () => {
    it('starts with null user and not authenticated', () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.university).toBeNull()
      expect(state.permissions).toEqual([])
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('sets user, university, permissions and isAuthenticated on successful login', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse)

      await useAuthStore.getState().login({ username: 'admin', password: 'admin123' })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockLoginResponse.user)
      expect(state.university).toEqual(mockLoginResponse.university)
      expect(state.permissions).toEqual(['VIEW_DASHBOARD', 'MANAGE_USERS'])
      expect(state.isAuthenticated).toBe(true)
    })

    it('saves locale to localStorage', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse)

      await useAuthStore.getState().login({ username: 'admin', password: 'admin123', locale: 'ru' })

      expect(localStorage.getItem('locale')).toBe('ru')
    })

    it('defaults locale to "uz" when not provided', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse)

      await useAuthStore.getState().login({ username: 'admin', password: 'admin123' })

      expect(localStorage.getItem('locale')).toBe('uz')
    })

    it('throws error on failed login', async () => {
      vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'))

      await expect(
        useAuthStore.getState().login({ username: 'wrong', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('logout', () => {
    it('clears all auth state', async () => {
      // Set authenticated state first
      useAuthStore.setState({
        user: mockLoginResponse.user,
        university: mockLoginResponse.university,
        permissions: mockLoginResponse.permissions,
        isAuthenticated: true,
      })
      vi.mocked(authApi.logout).mockResolvedValue(undefined)

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.university).toBeNull()
      expect(state.permissions).toEqual([])
      expect(state.isAuthenticated).toBe(false)
    })

    it('clears state even when API call fails', async () => {
      useAuthStore.setState({
        user: mockLoginResponse.user,
        isAuthenticated: true,
        permissions: ['VIEW_DASHBOARD'],
        university: mockLoginResponse.university,
      })
      vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'))

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('refresh', () => {
    it('updates user, university and permissions on success', async () => {
      useAuthStore.setState({ isAuthenticated: true })

      const refreshResponse: LoginResponse = {
        ...mockLoginResponse,
        permissions: ['VIEW_DASHBOARD', 'MANAGE_USERS', 'NEW_PERMISSION'],
      }
      vi.mocked(authApi.refreshToken).mockResolvedValue(refreshResponse)

      await useAuthStore.getState().refresh()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(refreshResponse.user)
      expect(state.permissions).toContain('NEW_PERMISSION')
    })

    it('calls logout and throws on refresh failure', async () => {
      useAuthStore.setState({
        user: mockLoginResponse.user,
        isAuthenticated: true,
        permissions: ['VIEW_DASHBOARD'],
        university: mockLoginResponse.university,
      })
      vi.mocked(authApi.refreshToken).mockRejectedValue(new Error('Token expired'))
      vi.mocked(authApi.logout).mockResolvedValue(undefined)

      await expect(useAuthStore.getState().refresh()).rejects.toThrow('Token expired')

      // logout should have been called (clears state)
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('initialize', () => {
    it('refreshes user data when authenticated', async () => {
      useAuthStore.setState({ isAuthenticated: true })
      vi.mocked(authApi.refreshToken).mockResolvedValue(mockLoginResponse)

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockLoginResponse.user)
      expect(authApi.refreshToken).toHaveBeenCalledOnce()
    })

    it('does nothing when not authenticated', async () => {
      useAuthStore.setState({ isAuthenticated: false })

      await useAuthStore.getState().initialize()

      expect(authApi.refreshToken).not.toHaveBeenCalled()
    })

    it('logs out when refresh fails during initialize', async () => {
      useAuthStore.setState({
        user: mockLoginResponse.user,
        isAuthenticated: true,
        permissions: ['VIEW_DASHBOARD'],
        university: mockLoginResponse.university,
      })
      vi.mocked(authApi.refreshToken).mockRejectedValue(new Error('Expired'))
      vi.mocked(authApi.logout).mockResolvedValue(undefined)

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
    })
  })

  describe('setLocale', () => {
    it('saves locale to localStorage', () => {
      useAuthStore.getState().setLocale('ru')
      expect(localStorage.getItem('locale')).toBe('ru')
    })

    it('updates user locale when user exists', () => {
      useAuthStore.setState({ user: mockLoginResponse.user })

      useAuthStore.getState().setLocale('en')

      expect(useAuthStore.getState().user?.locale).toBe('en')
    })

    it('does not crash when user is null', () => {
      useAuthStore.setState({ user: null })

      expect(() => useAuthStore.getState().setLocale('ru')).not.toThrow()
      expect(localStorage.getItem('locale')).toBe('ru')
    })
  })
})
