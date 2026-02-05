import axios from 'axios'

// Mock the apiClient module
const mockPost = vi.fn()
const mockGet = vi.fn()

vi.mock('@/api/client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}))

// Mock i18n
vi.mock('@/i18n/config', () => ({
  default: {
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
  },
}))

// Mock axios.isAxiosError
vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios')
  return {
    ...actual,
    default: {
      ...actual.default,
      isAxiosError: vi.fn(),
    },
  }
})

describe('auth.api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('successful login calls both endpoints and returns mapped user data', async () => {
      const { login } = await import('@/api/auth.api')

      // Mock POST /api/v1/web/auth/login
      mockPost.mockResolvedValueOnce({ data: { success: true } })

      // Mock GET /api/v1/web/auth/me
      mockGet.mockResolvedValueOnce({
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            username: 'admin',
            email: 'admin@hemis.uz',
            fullName: 'Admin User',
            locale: 'uz',
            active: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
          university: {
            id: 'uni-1',
            code: 'TSU',
            name: { uz: 'ToshDU', ru: 'ТашГУ', en: 'TSU' },
            active: true,
          },
          permissions: ['students:read', 'students:write'],
        },
      })

      const result = await login({
        username: 'admin',
        password: 'password123',
        locale: 'uz',
      })

      // Verify POST was called with correct credentials
      expect(mockPost).toHaveBeenCalledWith('/api/v1/web/auth/login', {
        username: 'admin',
        password: 'password123',
      })

      // Verify GET /me was called
      expect(mockGet).toHaveBeenCalledWith('/api/v1/web/auth/me')

      // Verify mapped user data
      expect(result.user).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'admin',
        email: 'admin@hemis.uz',
        name: 'Admin User',
        locale: 'uz',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
      })

      expect(result.university).toEqual({
        id: 'uni-1',
        code: 'TSU',
        name: { uz: 'ToshDU', ru: 'ТашГУ', en: 'TSU' },
        active: true,
      })

      expect(result.permissions).toEqual(['students:read', 'students:write'])
    })

    it('login with network error throws with custom i18n message', async () => {
      const { login } = await import('@/api/auth.api')

      const networkError = new Error('Network Error') as Error & {
        code?: string
        response?: unknown
        request?: unknown
        isAxiosError?: boolean
      }
      networkError.code = 'ERR_NETWORK'
      networkError.response = undefined
      networkError.request = { status: 0, readyState: 4 }

      mockPost.mockRejectedValueOnce(networkError)

      // Mock axios.isAxiosError to return true for our error
      vi.mocked(axios.isAxiosError).mockReturnValue(true)

      await expect(login({ username: 'admin', password: 'pass' })).rejects.toThrow(
        'Backend server ishlamayapti',
      )
    })

    it('login with backend error throws with backend message', async () => {
      const { login } = await import('@/api/auth.api')

      // Create error with a response (not a network error)
      const backendError = new Error('Request failed') as Error & {
        code?: string
        response?: { data: { message: string }; status: number }
        isAxiosError?: boolean
      }
      backendError.code = 'ERR_BAD_REQUEST'
      backendError.response = {
        data: { message: 'Login yoki parol xato' },
        status: 401,
      }

      mockPost.mockRejectedValueOnce(backendError)
      vi.mocked(axios.isAxiosError).mockReturnValue(true)

      await expect(login({ username: 'admin', password: 'wrong' })).rejects.toThrow(
        'Login yoki parol xato',
      )
    })

    it('login with non-Axios error throws the original error', async () => {
      const { login } = await import('@/api/auth.api')

      const genericError = new Error('Something unexpected')
      mockPost.mockRejectedValueOnce(genericError)

      // Mock axios.isAxiosError to return false for generic errors
      vi.mocked(axios.isAxiosError).mockReturnValue(false)

      await expect(login({ username: 'admin', password: 'pass' })).rejects.toThrow(
        'Something unexpected',
      )
    })

    it('login maps user with fallback values when optional fields are missing', async () => {
      const { login } = await import('@/api/auth.api')

      mockPost.mockResolvedValueOnce({ data: { success: true } })
      mockGet.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-1',
            username: 'testuser',
            // email and fullName are missing
          },
          // university and permissions are missing
        },
      })

      const result = await login({ username: 'testuser', password: 'pass' })

      expect(result.user.email).toBe('')
      expect(result.user.name).toBe('testuser') // falls back to username
      expect(result.university).toBeNull()
      expect(result.permissions).toEqual([])
    })
  })

  describe('refreshToken', () => {
    it('calls refresh endpoint then /me and returns mapped data', async () => {
      const { refreshToken } = await import('@/api/auth.api')

      // Mock POST /api/v1/web/auth/refresh
      mockPost.mockResolvedValueOnce({ data: { success: true } })

      // Mock GET /api/v1/web/auth/me
      mockGet.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-2',
            username: 'refreshed_user',
            email: 'user@hemis.uz',
            fullName: 'Refreshed User',
            locale: 'ru',
            active: true,
            createdAt: '2024-06-01T00:00:00Z',
          },
          university: null,
          permissions: ['dashboard:view'],
        },
      })

      const result = await refreshToken()

      // Verify refresh was called
      expect(mockPost).toHaveBeenCalledWith('/api/v1/web/auth/refresh', {})

      // Verify /me was called
      expect(mockGet).toHaveBeenCalledWith('/api/v1/web/auth/me')

      // Verify returned data
      expect(result.user.username).toBe('refreshed_user')
      expect(result.user.name).toBe('Refreshed User')
      expect(result.permissions).toEqual(['dashboard:view'])
    })

    it('refreshToken propagates errors from the refresh endpoint', async () => {
      const { refreshToken } = await import('@/api/auth.api')

      mockPost.mockRejectedValueOnce(new Error('Refresh failed'))

      await expect(refreshToken()).rejects.toThrow('Refresh failed')

      // /me should not have been called
      expect(mockGet).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('calls logout endpoint successfully', async () => {
      const { logout } = await import('@/api/auth.api')

      mockPost.mockResolvedValueOnce({ data: { success: true } })

      await logout()

      expect(mockPost).toHaveBeenCalledWith('/api/v1/web/auth/logout')
    })

    it('ignores errors from the logout endpoint', async () => {
      const { logout } = await import('@/api/auth.api')

      mockPost.mockRejectedValueOnce(new Error('Server down'))

      // Should not throw
      await expect(logout()).resolves.toBeUndefined()
    })
  })

  describe('getCurrentUser', () => {
    it('calls /me endpoint and returns mapped user', async () => {
      const { getCurrentUser } = await import('@/api/auth.api')

      mockGet.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-3',
            username: 'current_user',
            email: 'current@hemis.uz',
            fullName: 'Current User',
            locale: 'en',
            active: true,
            createdAt: '2024-03-15T10:30:00Z',
          },
        },
      })

      const result = await getCurrentUser()

      expect(mockGet).toHaveBeenCalledWith('/api/v1/web/auth/me')
      expect(result).toEqual({
        id: 'user-3',
        username: 'current_user',
        email: 'current@hemis.uz',
        name: 'Current User',
        locale: 'en',
        active: true,
        createdAt: '2024-03-15T10:30:00Z',
      })
    })
  })
})
