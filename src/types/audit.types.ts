/**
 * Audit Log Types
 */

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'IMPORT'
export type LoginEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'SESSION_EXPIRED'

// =====================================================
// Activity Log
// =====================================================

export interface ActivityLogRow {
  id: string
  userId: string | null
  username: string | null
  userIp: string | null
  action: AuditAction
  entityType: string | null
  entityId: string | null
  entityName: string | null
  changedFields: string[] | null
  endpoint: string | null
  requestId: string | null
  createdAt: string
}

export interface ActivityLogDetail extends ActivityLogRow {
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  userAgent: string | null
  sessionId: string | null
  description: string | null
}

// =====================================================
// Error Log
// =====================================================

export interface ErrorLogRow {
  id: string
  userId: string | null
  username: string | null
  userIp: string | null
  errorType: string | null
  errorMessage: string | null
  endpoint: string | null
  requestId: string | null
  createdAt: string
}

export interface ErrorLogDetail extends ErrorLogRow {
  stackTrace: string | null
  requestBody: Record<string, unknown> | null
}

// =====================================================
// Login Log
// =====================================================

export interface LoginLogRow {
  id: string
  userId: string | null
  username: string
  userIp: string | null
  userAgent: string | null
  eventType: LoginEventType
  failureReason: string | null
  createdAt: string
}

// =====================================================
// Statistics
// =====================================================

export interface AuditStats {
  totalActivities: number
  totalErrors: number
  totalLogins: number
  topUsers: Array<{ username: string; count: number }>
  errorsByType: Array<{ errorType: string; count: number }>
  loginsByType: Array<{ eventType: string; count: number }>
}

// =====================================================
// Filters
// =====================================================

export interface AuditLogFilter {
  page?: number
  size?: number
  userId?: string
  username?: string
  ip?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface ActivityLogFilter extends AuditLogFilter {
  action?: AuditAction
  entityType?: string
}

export interface ErrorLogFilter extends AuditLogFilter {
  errorType?: string
}

export interface LoginLogFilter extends AuditLogFilter {
  eventType?: LoginEventType
}

export interface StatsFilter {
  dateFrom?: string
  dateTo?: string
}

export interface EntityHistoryFilter {
  page?: number
  size?: number
}
