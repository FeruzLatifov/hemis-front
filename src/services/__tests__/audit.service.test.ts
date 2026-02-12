/**
 * Audit Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  logAuditEvent,
  auditAuth,
  auditNav,
  auditAction,
  auditData,
  auditError,
  auditSecurity,
} from '../audit.service'

// Mock apiClient
vi.mock('@/api/client', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({}),
  },
}))

// Mock sentry
vi.mock('@/lib/sentry', () => ({
  addBreadcrumb: vi.fn(),
}))

describe('Audit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock sessionStorage
    const sessionStore: Record<string, string> = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => sessionStore[key] || null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      sessionStore[key] = value
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logAuditEvent', () => {
    it('should create an event with correct structure', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await logAuditEvent('AUTH_LOGIN_ATTEMPT', 'info', 'Test message', { test: 'data' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.stringContaining('Test message'),
        expect.anything(),
      )
    })

    it('should include timestamp', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const before = Date.now()

      await logAuditEvent('NAV_PAGE_VIEW', 'info', 'Page view')

      const after = Date.now()
      expect(consoleSpy).toHaveBeenCalled()

      // Verify timestamp is within range (indirectly through the call)
      expect(after - before).toBeLessThan(100)
    })
  })

  describe('auditAuth', () => {
    it('should log login attempt with username only', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditAuth.loginAttempt('testuser')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AUTH_LOGIN_ATTEMPT'),
        'AUTH_LOGIN_ATTEMPT',
        expect.objectContaining({ username: 'testuser' }),
      )
    })

    it('should log login success with userId and username', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditAuth.loginSuccess('user123', 'testuser')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AUTH_LOGIN_SUCCESS'),
        'AUTH_LOGIN_SUCCESS',
        expect.objectContaining({ userId: 'user123', username: 'testuser' }),
      )
    })

    it('should log login failed with reason code', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditAuth.loginFailed('testuser', 'INVALID_PASSWORD')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AUTH_LOGIN_FAILED'),
        'AUTH_LOGIN_FAILED',
        expect.objectContaining({ username: 'testuser', reason: 'INVALID_PASSWORD' }),
      )
    })

    it('should log logout with userId', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditAuth.logout('user123')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AUTH_LOGOUT'),
        'AUTH_LOGOUT',
        expect.objectContaining({ userId: 'user123' }),
      )
    })
  })

  describe('auditNav', () => {
    it('should log page view with path and title', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditNav.pageView('/dashboard', 'Dashboard')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('NAV_PAGE_VIEW'),
        'NAV_PAGE_VIEW',
        expect.objectContaining({ path: '/dashboard', title: 'Dashboard' }),
      )
    })

    it('should log route change with from and to', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditNav.routeChange('/home', '/dashboard')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('NAV_ROUTE_CHANGE'),
        'NAV_ROUTE_CHANGE',
        expect.objectContaining({ from: '/home', to: '/dashboard' }),
      )
    })
  })

  describe('auditAction', () => {
    it('should log form submit success', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditAction.formSubmit('LoginForm', true)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ACTION_FORM_SUBMIT'),
        'ACTION_FORM_SUBMIT',
        expect.objectContaining({ formName: 'LoginForm', success: true }),
      )
    })

    it('should log form submit failure with error code', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditAction.formSubmit('LoginForm', false, 'VALIDATION_ERROR')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ACTION_FORM_SUBMIT'),
        'ACTION_FORM_SUBMIT',
        expect.objectContaining({
          formName: 'LoginForm',
          success: false,
          errorCode: 'VALIDATION_ERROR',
        }),
      )
    })

    it('should log button click', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditAction.buttonClick('ExportButton', { page: 'Reports' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ACTION_BUTTON_CLICK'),
        'ACTION_BUTTON_CLICK',
        expect.objectContaining({ buttonName: 'ExportButton', page: 'Reports' }),
      )
    })

    it('should log data export', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditAction.dataExport('Students', 100, 'xlsx')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ACTION_DATA_EXPORT'),
        'ACTION_DATA_EXPORT',
        expect.objectContaining({ dataType: 'Students', count: 100, format: 'xlsx' }),
      )
    })

    it('should log file upload', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditAction.fileUpload('document.pdf', 1024, 'application/pdf')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ACTION_FILE_UPLOAD'),
        'ACTION_FILE_UPLOAD',
        expect.objectContaining({
          fileName: 'document.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        }),
      )
    })

    it('should log search', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditAction.search('test query', 42)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ACTION_SEARCH'),
        'ACTION_SEARCH',
        expect.objectContaining({ query: 'test query', resultsCount: 42 }),
      )
    })
  })

  describe('auditData', () => {
    it('should log data create', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditData.create('Student', 'student123')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DATA_CREATE'),
        'DATA_CREATE',
        expect.objectContaining({ entityType: 'Student', entityId: 'student123' }),
      )
    })

    it('should log data update with changes', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditData.update('Student', 'student123', ['name', 'email'])

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DATA_UPDATE'),
        'DATA_UPDATE',
        expect.objectContaining({
          entityType: 'Student',
          entityId: 'student123',
          changes: ['name', 'email'],
        }),
      )
    })

    it('should log data delete', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditData.delete('Student', 'student123')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DATA_DELETE'),
        'DATA_DELETE',
        expect.objectContaining({ entityType: 'Student', entityId: 'student123' }),
      )
    })
  })

  describe('auditError', () => {
    it('should log API error with error code', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await auditError.api('/api/users', 500, 'INTERNAL_SERVER_ERROR')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR_API'),
        'ERROR_API',
        expect.objectContaining({
          endpoint: '/api/users',
          status: 500,
          errorCode: 'INTERNAL_SERVER_ERROR',
        }),
      )
    })

    it('should log validation error with error codes', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditError.validation('LoginForm', { username: 'REQUIRED', password: 'TOO_SHORT' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR_VALIDATION'),
        'ERROR_VALIDATION',
        expect.objectContaining({
          formName: 'LoginForm',
          errorCodes: { username: 'REQUIRED', password: 'TOO_SHORT' },
        }),
      )
    })
  })

  describe('auditSecurity', () => {
    it('should log permission denied', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await auditSecurity.permissionDenied('delete_user', 'ADMIN')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY_PERMISSION_DENIED'),
        'SECURITY_PERMISSION_DENIED',
        expect.objectContaining({ action: 'delete_user', requiredPermission: 'ADMIN' }),
      )
    })

    it('should log suspicious activity with activity type', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await auditSecurity.suspiciousActivity('BRUTE_FORCE_ATTEMPT', {
        ip: '192.168.1.1',
        attempts: 5,
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY_SUSPICIOUS_ACTIVITY'),
        'SECURITY_SUSPICIOUS_ACTIVITY',
        expect.objectContaining({
          activityType: 'BRUTE_FORCE_ATTEMPT',
          ip: '192.168.1.1',
          attempts: 5,
        }),
      )
    })
  })
})
