import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as authApi from '@/api/auth.api'
import type { LoginResponse, AdminUser } from '@/types/auth.types'
import {
  validateCredentials,
  getCurrentLocale,
  setCurrentLocale,
  clearAuthStorage,
  login,
  logout,
  refreshSession,
  getCurrentUser,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '../auth.service'

vi.mock('@/api/auth.api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn(),
}))

const mockedAuthApi = vi.mocked(authApi)

const mockUser: AdminUser = {
  id: '1',
  username: 'admin',
  email: 'admin@test.com',
  name: 'Admin User',
  locale: 'uz',
  active: true,
  createdAt: '2024-01-01T00:00:00Z',
}

const mockLoginResponse: LoginResponse = {
  user: mockUser,
  university: null,
  permissions: ['admin'],
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('validateCredentials', () => {
  it('returns valid for correct credentials', () => {
    const result = validateCredentials({ username: 'admin', password: 'pass1234' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns error for empty username', () => {
    const result = validateCredentials({ username: '', password: 'pass1234' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Username majburiy')
  })

  it('returns error for whitespace-only username', () => {
    const result = validateCredentials({ username: '   ', password: 'pass1234' })
    expect(result.valid).toBe(false)
  })

  it('returns error for missing password', () => {
    const result = validateCredentials({ username: 'admin', password: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Parol majburiy')
  })

  it('returns error for short password', () => {
    const result = validateCredentials({ username: 'admin', password: 'abc' })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('4 ta')
  })

  it('returns error for unsupported locale', () => {
    // Use type assertion for testing invalid locale
    const result = validateCredentials({
      username: 'admin',
      password: 'pass1234',
      locale: 'fr' as 'uz',
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('fr')
  })

  it('accepts valid locale', () => {
    const result = validateCredentials({ username: 'admin', password: 'pass1234', locale: 'uz' })
    expect(result.valid).toBe(true)
  })
})

describe('getCurrentLocale', () => {
  it('returns default locale when nothing stored', () => {
    expect(getCurrentLocale()).toBe('uz')
  })

  it('returns stored locale', () => {
    localStorage.setItem('locale', 'ru')
    expect(getCurrentLocale()).toBe('ru')
  })
})

describe('setCurrentLocale', () => {
  it('stores supported locale', () => {
    setCurrentLocale('en')
    expect(localStorage.getItem('locale')).toBe('en')
  })

  it('ignores unsupported locale', () => {
    setCurrentLocale('fr')
    expect(localStorage.getItem('locale')).toBeNull()
  })
})

describe('clearAuthStorage', () => {
  it('removes auth key but keeps locale', () => {
    localStorage.setItem('auth-storage', 'token-data')
    localStorage.setItem('locale', 'ru')
    clearAuthStorage()
    expect(localStorage.getItem('auth-storage')).toBeNull()
    expect(localStorage.getItem('locale')).toBe('ru')
  })
})

describe('login', () => {
  it('calls API after validation', async () => {
    mockedAuthApi.login.mockResolvedValue(mockLoginResponse)

    const result = await login({ username: 'admin', password: 'pass1234' })
    expect(result).toEqual(mockLoginResponse)
    expect(mockedAuthApi.login).toHaveBeenCalled()
  })

  it('throws on invalid credentials', async () => {
    await expect(login({ username: '', password: '' })).rejects.toThrow()
    expect(mockedAuthApi.login).not.toHaveBeenCalled()
  })

  it('sets locale before API call', async () => {
    mockedAuthApi.login.mockResolvedValue(mockLoginResponse)
    await login({ username: 'admin', password: 'pass1234', locale: 'en' })
    expect(localStorage.getItem('locale')).toBe('en')
  })
})

describe('logout', () => {
  it('clears auth storage even when API fails', async () => {
    mockedAuthApi.logout.mockRejectedValue(new Error('Network error'))
    localStorage.setItem('auth-storage', 'some-data')

    await logout()
    expect(localStorage.getItem('auth-storage')).toBeNull()
  })

  it('calls API logout', async () => {
    mockedAuthApi.logout.mockResolvedValue(undefined)
    await logout()
    expect(mockedAuthApi.logout).toHaveBeenCalled()
  })
})

describe('refreshSession', () => {
  it('delegates to API refreshToken', async () => {
    mockedAuthApi.refreshToken.mockResolvedValue(mockLoginResponse)
    const result = await refreshSession()
    expect(result).toEqual(mockLoginResponse)
  })
})

describe('getCurrentUser', () => {
  it('delegates to API getCurrentUser', async () => {
    mockedAuthApi.getCurrentUser.mockResolvedValue(mockUser)
    const result = await getCurrentUser()
    expect(result).toEqual(mockUser)
  })
})

describe('hasPermission', () => {
  it('returns true when permission exists', () => {
    expect(hasPermission(['admin', 'user.read'], 'admin')).toBe(true)
  })

  it('returns false when permission missing', () => {
    expect(hasPermission(['user.read'], 'admin')).toBe(false)
  })
})

describe('hasAnyPermission', () => {
  it('returns true when any permission matches', () => {
    expect(hasAnyPermission(['user.read'], ['admin', 'user.read'])).toBe(true)
  })

  it('returns false when no permission matches', () => {
    expect(hasAnyPermission(['user.read'], ['admin', 'user.write'])).toBe(false)
  })
})

describe('hasAllPermissions', () => {
  it('returns true when all permissions exist', () => {
    expect(hasAllPermissions(['admin', 'user.read'], ['admin', 'user.read'])).toBe(true)
  })

  it('returns false when some permissions missing', () => {
    expect(hasAllPermissions(['user.read'], ['admin', 'user.read'])).toBe(false)
  })
})
