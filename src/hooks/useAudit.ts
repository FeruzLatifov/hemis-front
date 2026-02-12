/**
 * Audit Logging Hooks
 *
 * React hooks for integrating audit logging into components.
 */

import { useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  auditNav,
  auditAction,
  auditData,
  auditError,
  auditAuth,
  auditSecurity,
  logAuditEvent,
  type AuditEventType,
  type AuditSeverity,
} from '@/services/audit.service'

/**
 * Hook to track page views automatically
 *
 * @example
 * function App() {
 *   usePageViewTracking()
 *   return <Routes>...</Routes>
 * }
 */
export function usePageViewTracking() {
  const location = useLocation()
  const previousPath = useRef<string>('')

  useEffect(() => {
    const currentPath = location.pathname + location.search

    // Track page view
    auditNav.pageView(currentPath, document.title)

    // Track route change if there was a previous path
    if (previousPath.current && previousPath.current !== currentPath) {
      auditNav.routeChange(previousPath.current, currentPath)
    }

    previousPath.current = currentPath
  }, [location.pathname, location.search])
}

/**
 * Hook for form audit logging
 *
 * @example
 * function MyForm() {
 *   const { trackSubmit, trackValidationError } = useFormAudit('LoginForm')
 *
 *   const onSubmit = async (data) => {
 *     try {
 *       await api.login(data)
 *       trackSubmit(true)
 *     } catch (error) {
 *       trackSubmit(false, error.message)
 *     }
 *   }
 *
 *   const onError = (errors) => {
 *     trackValidationError(errors)
 *   }
 * }
 */
export function useFormAudit(formName: string) {
  const trackSubmit = useCallback(
    (success: boolean, errorMessage?: string) => {
      auditAction.formSubmit(formName, success, errorMessage)
    },
    [formName],
  )

  const trackValidationError = useCallback(
    (errors: Record<string, string>) => {
      auditError.validation(formName, errors)
    },
    [formName],
  )

  return {
    trackSubmit,
    trackValidationError,
  }
}

/**
 * Hook for data operation audit logging
 *
 * @example
 * function UserList() {
 *   const audit = useDataAudit('User')
 *
 *   const handleDelete = async (id) => {
 *     await api.deleteUser(id)
 *     audit.trackDelete(id)
 *   }
 * }
 */
export function useDataAudit(entityType: string) {
  const trackCreate = useCallback(
    (entityId?: string) => {
      auditData.create(entityType, entityId)
    },
    [entityType],
  )

  const trackUpdate = useCallback(
    (entityId: string, changes?: string[]) => {
      auditData.update(entityType, entityId, changes)
    },
    [entityType],
  )

  const trackDelete = useCallback(
    (entityId: string) => {
      auditData.delete(entityType, entityId)
    },
    [entityType],
  )

  const trackView = useCallback(
    (entityId: string) => {
      auditData.view(entityType, entityId)
    },
    [entityType],
  )

  return {
    trackCreate,
    trackUpdate,
    trackDelete,
    trackView,
  }
}

/**
 * Hook for button/action audit logging
 *
 * @example
 * function ExportButton() {
 *   const trackClick = useButtonAudit('ExportButton', { page: 'Reports' })
 *
 *   return <Button onClick={() => { trackClick(); doExport() }}>Export</Button>
 * }
 */
export function useButtonAudit(buttonName: string, context?: Record<string, unknown>) {
  return useCallback(() => {
    auditAction.buttonClick(buttonName, context)
  }, [buttonName, context])
}

/**
 * Hook for search audit logging
 *
 * @example
 * function SearchBox() {
 *   const trackSearch = useSearchAudit()
 *
 *   const onSearch = async (query) => {
 *     const results = await api.search(query)
 *     trackSearch(query, results.length)
 *   }
 * }
 */
export function useSearchAudit() {
  return useCallback((query: string, resultsCount?: number) => {
    auditAction.search(query, resultsCount)
  }, [])
}

/**
 * Hook for filter audit logging
 *
 * @example
 * function FilterPanel() {
 *   const trackFilter = useFilterAudit()
 *
 *   const onFilterChange = (name, value) => {
 *     trackFilter(name, value)
 *     applyFilter(name, value)
 *   }
 * }
 */
export function useFilterAudit() {
  return useCallback((filterName: string, filterValue: unknown) => {
    auditAction.filter(filterName, filterValue)
  }, [])
}

/**
 * Hook for file operation audit logging
 *
 * @example
 * function FileUploader() {
 *   const { trackUpload, trackDownload } = useFileAudit()
 *
 *   const onUpload = (file) => {
 *     trackUpload(file.name, file.size, file.type)
 *   }
 * }
 */
export function useFileAudit() {
  const trackUpload = useCallback((fileName: string, fileSize: number, fileType: string) => {
    auditAction.fileUpload(fileName, fileSize, fileType)
  }, [])

  const trackDownload = useCallback((fileName: string, fileType?: string) => {
    auditAction.fileDownload(fileName, fileType)
  }, [])

  const trackExport = useCallback((dataType: string, count: number, format?: string) => {
    auditAction.dataExport(dataType, count, format)
  }, [])

  return {
    trackUpload,
    trackDownload,
    trackExport,
  }
}

/**
 * Hook for auth audit logging
 *
 * @example
 * function LoginPage() {
 *   const authAudit = useAuthAudit()
 *
 *   const onLogin = async (credentials) => {
 *     authAudit.trackLoginAttempt(credentials.username)
 *     try {
 *       const user = await api.login(credentials)
 *       authAudit.trackLoginSuccess(user.id, user.username)
 *     } catch (error) {
 *       authAudit.trackLoginFailed(credentials.username, error.message)
 *     }
 *   }
 * }
 */
export function useAuthAudit() {
  return {
    trackLoginAttempt: auditAuth.loginAttempt,
    trackLoginSuccess: auditAuth.loginSuccess,
    trackLoginFailed: auditAuth.loginFailed,
    trackLogout: auditAuth.logout,
    trackSessionExpired: auditAuth.sessionExpired,
    trackTokenRefresh: auditAuth.tokenRefresh,
  }
}

/**
 * Hook for security audit logging
 *
 * @example
 * function ProtectedRoute({ children, permission }) {
 *   const securityAudit = useSecurityAudit()
 *   const { hasPermission } = useAuth()
 *
 *   if (!hasPermission(permission)) {
 *     securityAudit.trackPermissionDenied('view_page', permission)
 *     return <Navigate to="/unauthorized" />
 *   }
 * }
 */
export function useSecurityAudit() {
  return {
    trackPermissionDenied: auditSecurity.permissionDenied,
    trackInvalidToken: auditSecurity.invalidToken,
    trackSuspiciousActivity: auditSecurity.suspiciousActivity,
  }
}

/**
 * Generic audit hook for custom events
 *
 * @example
 * const logEvent = useAuditLog()
 * logEvent('CUSTOM_EVENT', 'info', 'Custom action performed', { key: 'value' })
 */
export function useAuditLog() {
  return useCallback(
    (
      type: AuditEventType,
      severity: AuditSeverity,
      message: string,
      metadata?: Record<string, unknown>,
    ) => {
      logAuditEvent(type, severity, message, metadata)
    },
    [],
  )
}

// Re-export audit functions for direct use
export { auditAuth, auditNav, auditAction, auditData, auditError, auditSecurity }
