import apiClient from './client'
import type {
  ActivityLogRow,
  ActivityLogDetail,
  ErrorLogRow,
  ErrorLogDetail,
  LoginLogRow,
  AuditStats,
  ActivityLogFilter,
  ErrorLogFilter,
  LoginLogFilter,
  StatsFilter,
  EntityHistoryFilter,
} from '@/types/audit.types'

interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  page: number
  first: boolean
  last: boolean
  hasNext: boolean
  hasPrevious: boolean
  numberOfElements: number
  empty: boolean
}

export const auditApi = {
  // =====================================================
  // Activity Logs
  // =====================================================

  async getActivities(params: ActivityLogFilter = {}): Promise<PagedResponse<ActivityLogRow>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<ActivityLogRow>
    }>('/api/v1/web/audit/activities', { params })
    return response.data.data
  },

  async getActivityDetail(id: string): Promise<ActivityLogDetail> {
    const response = await apiClient.get<{
      success: boolean
      data: ActivityLogDetail
    }>(`/api/v1/web/audit/activities/${id}`)
    return response.data.data
  },

  // =====================================================
  // Error Logs
  // =====================================================

  async getErrors(params: ErrorLogFilter = {}): Promise<PagedResponse<ErrorLogRow>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<ErrorLogRow>
    }>('/api/v1/web/audit/errors', { params })
    return response.data.data
  },

  async getErrorDetail(id: string): Promise<ErrorLogDetail> {
    const response = await apiClient.get<{
      success: boolean
      data: ErrorLogDetail
    }>(`/api/v1/web/audit/errors/${id}`)
    return response.data.data
  },

  // =====================================================
  // Login Logs
  // =====================================================

  async getLogins(params: LoginLogFilter = {}): Promise<PagedResponse<LoginLogRow>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<LoginLogRow>
    }>('/api/v1/web/audit/logins', { params })
    return response.data.data
  },

  // =====================================================
  // Entity History
  // =====================================================

  async getEntityHistory(
    entityType: string,
    entityId: string,
    params: EntityHistoryFilter = {},
  ): Promise<PagedResponse<Record<string, unknown>>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<Record<string, unknown>>
    }>(`/api/v1/web/audit/entities/${entityType}/${entityId}/history`, { params })
    return response.data.data
  },

  // =====================================================
  // Statistics
  // =====================================================

  async getStats(params: StatsFilter = {}): Promise<AuditStats> {
    const response = await apiClient.get<{
      success: boolean
      data: AuditStats
    }>('/api/v1/web/audit/stats', { params })
    return response.data.data
  },
}
