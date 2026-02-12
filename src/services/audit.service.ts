/**
 * Audit Logging Service
 *
 * Frontend event tracking for security and analytics.
 * Integrates with Sentry and backend audit API.
 *
 * Features:
 * - User action tracking
 * - Security event logging
 * - Performance monitoring
 * - Error tracking
 */

import { addBreadcrumb } from '@/lib/sentry'
import apiClient from '@/api/client'

/**
 * Audit Event Types
 */
export type AuditEventType =
  // Authentication Events
  | 'AUTH_LOGIN_ATTEMPT'
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_TOKEN_REFRESH'
  // Navigation Events
  | 'NAV_PAGE_VIEW'
  | 'NAV_ROUTE_CHANGE'
  // User Actions
  | 'ACTION_FORM_SUBMIT'
  | 'ACTION_BUTTON_CLICK'
  | 'ACTION_DATA_EXPORT'
  | 'ACTION_FILE_UPLOAD'
  | 'ACTION_FILE_DOWNLOAD'
  | 'ACTION_SEARCH'
  | 'ACTION_FILTER'
  // Data Events
  | 'DATA_CREATE'
  | 'DATA_UPDATE'
  | 'DATA_DELETE'
  | 'DATA_VIEW'
  // Error Events
  | 'ERROR_API'
  | 'ERROR_VALIDATION'
  | 'ERROR_PERMISSION'
  | 'ERROR_NETWORK'
  // Security Events
  | 'SECURITY_PERMISSION_DENIED'
  | 'SECURITY_INVALID_TOKEN'
  | 'SECURITY_SUSPICIOUS_ACTIVITY'

/**
 * Audit Event Severity
 */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Audit Event Payload
 */
export interface AuditEvent {
  type: AuditEventType
  severity: AuditSeverity
  message: string
  timestamp: string
  userId?: string
  sessionId?: string
  metadata?: Record<string, unknown>
  // Browser/Device info
  userAgent?: string
  url?: string
  referrer?: string
}

/**
 * Audit Log Options
 */
interface AuditLogOptions {
  /** Send to backend API */
  sendToBackend?: boolean
  /** Add as Sentry breadcrumb */
  addToSentry?: boolean
  /** Log to console in development */
  consoleLog?: boolean
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: AuditLogOptions = {
  sendToBackend: true,
  addToSentry: true,
  consoleLog: import.meta.env.DEV,
}

/**
 * Get session ID from storage
 */
export function getSessionId(): string | undefined {
  try {
    return sessionStorage.getItem('sessionId') ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Get current user ID from auth store
 */
function getCurrentUserId(): string | undefined {
  try {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed?.state?.user?.id
    }
  } catch {
    // Ignore parse errors
  }
  return undefined
}

/**
 * Generate session ID if not exists
 */
function ensureSessionId(): string {
  let sessionId = sessionStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    sessionStorage.setItem('sessionId', sessionId)
  }
  return sessionId
}

/**
 * Create audit event with common fields
 */
function createAuditEvent(
  type: AuditEventType,
  severity: AuditSeverity,
  message: string,
  metadata?: Record<string, unknown>,
): AuditEvent {
  return {
    type,
    severity,
    message,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(),
    sessionId: ensureSessionId(),
    metadata,
    userAgent: navigator.userAgent,
    url: window.location.href,
    referrer: document.referrer || undefined,
  }
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  type: AuditEventType,
  severity: AuditSeverity,
  message: string,
  metadata?: Record<string, unknown>,
  options: AuditLogOptions = DEFAULT_OPTIONS,
): Promise<void> {
  const event = createAuditEvent(type, severity, message, metadata)

  // Console log in development
  if (options.consoleLog) {
    const logFn = severity === 'error' || severity === 'critical' ? console.error : console.log
    logFn(`[AUDIT] ${type}:`, message, metadata || '')
  }

  // Add to Sentry breadcrumbs
  if (options.addToSentry) {
    addBreadcrumb({
      category: 'audit',
      message: `${type}: ${message}`,
      level: severity === 'critical' ? 'error' : severity,
      data: metadata,
    })
  }

  // Send to backend (non-blocking)
  if (options.sendToBackend) {
    try {
      await apiClient.post('/api/v1/web/audit/log', event, {
        // Don't retry audit logs
        timeout: 5000,
      })
    } catch {
      // Silently fail - don't block user actions
      if (import.meta.env.DEV) {
        console.warn('[AUDIT] Failed to send event to backend')
      }
    }
  }
}

// ============================================
// Convenience Functions (no hardcoded messages)
// ============================================

/**
 * Log authentication events
 */
export const auditAuth = {
  loginAttempt: (username: string) =>
    logAuditEvent('AUTH_LOGIN_ATTEMPT', 'info', 'AUTH_LOGIN_ATTEMPT', { username }),

  loginSuccess: (userId: string, username: string) =>
    logAuditEvent('AUTH_LOGIN_SUCCESS', 'info', 'AUTH_LOGIN_SUCCESS', { userId, username }),

  loginFailed: (username: string, reason?: string) =>
    logAuditEvent('AUTH_LOGIN_FAILED', 'warning', 'AUTH_LOGIN_FAILED', { username, reason }),

  logout: (userId?: string) => logAuditEvent('AUTH_LOGOUT', 'info', 'AUTH_LOGOUT', { userId }),

  sessionExpired: (userId?: string) =>
    logAuditEvent('AUTH_SESSION_EXPIRED', 'warning', 'AUTH_SESSION_EXPIRED', { userId }),

  tokenRefresh: () => logAuditEvent('AUTH_TOKEN_REFRESH', 'info', 'AUTH_TOKEN_REFRESH'),
}

/**
 * Log navigation events
 */
export const auditNav = {
  pageView: (path: string, title?: string) =>
    logAuditEvent('NAV_PAGE_VIEW', 'info', 'NAV_PAGE_VIEW', { path, title }),

  routeChange: (from: string, to: string) =>
    logAuditEvent('NAV_ROUTE_CHANGE', 'info', 'NAV_ROUTE_CHANGE', { from, to }),
}

/**
 * Log user actions
 */
export const auditAction = {
  formSubmit: (formName: string, success: boolean, errorCode?: string) =>
    logAuditEvent('ACTION_FORM_SUBMIT', success ? 'info' : 'warning', 'ACTION_FORM_SUBMIT', {
      formName,
      success,
      errorCode,
    }),

  buttonClick: (buttonName: string, context?: Record<string, unknown>) =>
    logAuditEvent('ACTION_BUTTON_CLICK', 'info', 'ACTION_BUTTON_CLICK', {
      buttonName,
      ...context,
    }),

  dataExport: (dataType: string, count: number, format?: string) =>
    logAuditEvent('ACTION_DATA_EXPORT', 'info', 'ACTION_DATA_EXPORT', {
      dataType,
      count,
      format,
    }),

  fileUpload: (fileName: string, fileSize: number, fileType: string) =>
    logAuditEvent('ACTION_FILE_UPLOAD', 'info', 'ACTION_FILE_UPLOAD', {
      fileName,
      fileSize,
      fileType,
    }),

  fileDownload: (fileName: string, fileType?: string) =>
    logAuditEvent('ACTION_FILE_DOWNLOAD', 'info', 'ACTION_FILE_DOWNLOAD', {
      fileName,
      fileType,
    }),

  search: (query: string, resultsCount?: number) =>
    logAuditEvent('ACTION_SEARCH', 'info', 'ACTION_SEARCH', { query, resultsCount }),

  filter: (filterName: string, filterValue: unknown) =>
    logAuditEvent('ACTION_FILTER', 'info', 'ACTION_FILTER', { filterName, filterValue }),
}

/**
 * Log data operations
 */
export const auditData = {
  create: (entityType: string, entityId?: string) =>
    logAuditEvent('DATA_CREATE', 'info', 'DATA_CREATE', { entityType, entityId }),

  update: (entityType: string, entityId: string, changes?: string[]) =>
    logAuditEvent('DATA_UPDATE', 'info', 'DATA_UPDATE', { entityType, entityId, changes }),

  delete: (entityType: string, entityId: string) =>
    logAuditEvent('DATA_DELETE', 'warning', 'DATA_DELETE', { entityType, entityId }),

  view: (entityType: string, entityId: string) =>
    logAuditEvent('DATA_VIEW', 'info', 'DATA_VIEW', { entityType, entityId }),
}

/**
 * Log errors
 */
export const auditError = {
  api: (endpoint: string, status: number, errorCode?: string) =>
    logAuditEvent('ERROR_API', 'error', 'ERROR_API', { endpoint, status, errorCode }),

  validation: (formName: string, errorCodes: Record<string, string>) =>
    logAuditEvent('ERROR_VALIDATION', 'warning', 'ERROR_VALIDATION', { formName, errorCodes }),

  permission: (action: string, resource?: string) =>
    logAuditEvent('ERROR_PERMISSION', 'warning', 'ERROR_PERMISSION', { action, resource }),

  network: (url: string, errorCode?: string) =>
    logAuditEvent('ERROR_NETWORK', 'error', 'ERROR_NETWORK', { url, errorCode }),
}

/**
 * Log security events
 */
export const auditSecurity = {
  permissionDenied: (action: string, requiredPermission?: string) =>
    logAuditEvent('SECURITY_PERMISSION_DENIED', 'warning', 'SECURITY_PERMISSION_DENIED', {
      action,
      requiredPermission,
    }),

  invalidToken: () => logAuditEvent('SECURITY_INVALID_TOKEN', 'error', 'SECURITY_INVALID_TOKEN'),

  suspiciousActivity: (activityType: string, details?: Record<string, unknown>) =>
    logAuditEvent('SECURITY_SUSPICIOUS_ACTIVITY', 'critical', 'SECURITY_SUSPICIOUS_ACTIVITY', {
      activityType,
      ...details,
    }),
}

// Initialize session ID on load
if (typeof window !== 'undefined') {
  ensureSessionId()
}

export default {
  logAuditEvent,
  auth: auditAuth,
  nav: auditNav,
  action: auditAction,
  data: auditData,
  error: auditError,
  security: auditSecurity,
}
