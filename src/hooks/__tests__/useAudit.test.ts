/**
 * Tests for useAudit hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/dashboard', search: '' }),
}))

// Mock audit service — factory must not reference outer variables
vi.mock('@/services/audit.service', () => ({
  auditNav: {
    pageView: vi.fn(),
    routeChange: vi.fn(),
  },
  auditAction: {
    formSubmit: vi.fn(),
    buttonClick: vi.fn(),
    search: vi.fn(),
    filter: vi.fn(),
    fileUpload: vi.fn(),
    fileDownload: vi.fn(),
    dataExport: vi.fn(),
  },
  auditData: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    view: vi.fn(),
  },
  auditError: {
    validation: vi.fn(),
  },
  auditAuth: {
    loginAttempt: vi.fn(),
    loginSuccess: vi.fn(),
    loginFailed: vi.fn(),
    logout: vi.fn(),
    sessionExpired: vi.fn(),
    tokenRefresh: vi.fn(),
  },
  auditSecurity: {
    permissionDenied: vi.fn(),
    invalidToken: vi.fn(),
    suspiciousActivity: vi.fn(),
  },
  logAuditEvent: vi.fn(),
}))

// Import mocked modules AFTER vi.mock
import {
  auditNav,
  auditAction,
  auditData,
  auditError,
  auditAuth,
  auditSecurity,
  logAuditEvent,
} from '@/services/audit.service'
import {
  usePageViewTracking,
  useFormAudit,
  useDataAudit,
  useButtonAudit,
  useSearchAudit,
  useFilterAudit,
  useFileAudit,
  useAuthAudit,
  useSecurityAudit,
  useAuditLog,
} from '@/hooks/useAudit'

const mockAuditNav = auditNav as unknown as {
  pageView: ReturnType<typeof vi.fn>
  routeChange: ReturnType<typeof vi.fn>
}
const mockAuditAction = auditAction as unknown as Record<string, ReturnType<typeof vi.fn>>
const mockAuditData = auditData as unknown as Record<string, ReturnType<typeof vi.fn>>
const mockAuditError = auditError as unknown as { validation: ReturnType<typeof vi.fn> }
const mockLogAuditEvent = logAuditEvent as unknown as ReturnType<typeof vi.fn>

describe('usePageViewTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks page view on mount', () => {
    renderHook(() => usePageViewTracking())
    expect(mockAuditNav.pageView).toHaveBeenCalledWith('/dashboard', expect.any(String))
  })
})

describe('useFormAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks form submit with success', () => {
    const { result } = renderHook(() => useFormAudit('LoginForm'))

    act(() => {
      result.current.trackSubmit(true)
    })

    expect(mockAuditAction.formSubmit).toHaveBeenCalledWith('LoginForm', true, undefined)
  })

  it('tracks form submit with error', () => {
    const { result } = renderHook(() => useFormAudit('LoginForm'))

    act(() => {
      result.current.trackSubmit(false, 'Invalid credentials')
    })

    expect(mockAuditAction.formSubmit).toHaveBeenCalledWith(
      'LoginForm',
      false,
      'Invalid credentials',
    )
  })

  it('tracks validation errors', () => {
    const { result } = renderHook(() => useFormAudit('RegistrationForm'))

    const errors = { email: 'Invalid email', name: 'Required' }
    act(() => {
      result.current.trackValidationError(errors)
    })

    expect(mockAuditError.validation).toHaveBeenCalledWith('RegistrationForm', errors)
  })
})

describe('useDataAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks create operation', () => {
    const { result } = renderHook(() => useDataAudit('Student'))

    act(() => {
      result.current.trackCreate('student-123')
    })

    expect(mockAuditData.create).toHaveBeenCalledWith('Student', 'student-123')
  })

  it('tracks update operation with changes', () => {
    const { result } = renderHook(() => useDataAudit('University'))

    act(() => {
      result.current.trackUpdate('univ-456', ['name', 'address'])
    })

    expect(mockAuditData.update).toHaveBeenCalledWith('University', 'univ-456', ['name', 'address'])
  })

  it('tracks delete operation', () => {
    const { result } = renderHook(() => useDataAudit('Student'))

    act(() => {
      result.current.trackDelete('student-789')
    })

    expect(mockAuditData.delete).toHaveBeenCalledWith('Student', 'student-789')
  })

  it('tracks view operation', () => {
    const { result } = renderHook(() => useDataAudit('Faculty'))

    act(() => {
      result.current.trackView('fac-001')
    })

    expect(mockAuditData.view).toHaveBeenCalledWith('Faculty', 'fac-001')
  })
})

describe('useButtonAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks button click', () => {
    const { result } = renderHook(() => useButtonAudit('ExportBtn', { page: 'Reports' }))

    act(() => {
      result.current()
    })

    expect(mockAuditAction.buttonClick).toHaveBeenCalledWith('ExportBtn', { page: 'Reports' })
  })
})

describe('useSearchAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks search query with results count', () => {
    const { result } = renderHook(() => useSearchAudit())

    act(() => {
      result.current('test query', 15)
    })

    expect(mockAuditAction.search).toHaveBeenCalledWith('test query', 15)
  })
})

describe('useFilterAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks filter change', () => {
    const { result } = renderHook(() => useFilterAudit())

    act(() => {
      result.current('status', 'active')
    })

    expect(mockAuditAction.filter).toHaveBeenCalledWith('status', 'active')
  })
})

describe('useFileAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks file upload', () => {
    const { result } = renderHook(() => useFileAudit())

    act(() => {
      result.current.trackUpload('doc.pdf', 1024, 'application/pdf')
    })

    expect(mockAuditAction.fileUpload).toHaveBeenCalledWith('doc.pdf', 1024, 'application/pdf')
  })

  it('tracks file download', () => {
    const { result } = renderHook(() => useFileAudit())

    act(() => {
      result.current.trackDownload('report.xlsx', 'application/xlsx')
    })

    expect(mockAuditAction.fileDownload).toHaveBeenCalledWith('report.xlsx', 'application/xlsx')
  })

  it('tracks data export', () => {
    const { result } = renderHook(() => useFileAudit())

    act(() => {
      result.current.trackExport('students', 100, 'xlsx')
    })

    expect(mockAuditAction.dataExport).toHaveBeenCalledWith('students', 100, 'xlsx')
  })
})

describe('useAuthAudit', () => {
  it('exposes all auth audit methods', () => {
    const { result } = renderHook(() => useAuthAudit())

    expect(result.current.trackLoginAttempt).toBe(auditAuth.loginAttempt)
    expect(result.current.trackLoginSuccess).toBe(auditAuth.loginSuccess)
    expect(result.current.trackLoginFailed).toBe(auditAuth.loginFailed)
    expect(result.current.trackLogout).toBe(auditAuth.logout)
    expect(result.current.trackSessionExpired).toBe(auditAuth.sessionExpired)
    expect(result.current.trackTokenRefresh).toBe(auditAuth.tokenRefresh)
  })
})

describe('useSecurityAudit', () => {
  it('exposes all security audit methods', () => {
    const { result } = renderHook(() => useSecurityAudit())

    expect(result.current.trackPermissionDenied).toBe(auditSecurity.permissionDenied)
    expect(result.current.trackInvalidToken).toBe(auditSecurity.invalidToken)
    expect(result.current.trackSuspiciousActivity).toBe(auditSecurity.suspiciousActivity)
  })
})

describe('useAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs custom audit event', () => {
    const { result } = renderHook(() => useAuditLog())

    act(() => {
      result.current(
        'NAVIGATION' as unknown as Parameters<typeof result.current>[0],
        'info' as unknown as Parameters<typeof result.current>[1],
        'User navigated',
        { target: '/page' },
      )
    })

    expect(mockLogAuditEvent).toHaveBeenCalledWith('NAVIGATION', 'info', 'User navigated', {
      target: '/page',
    })
  })
})
