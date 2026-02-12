import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api/audit.api'
import { queryKeys } from '@/lib/queryKeys'
import type {
  ActivityLogFilter,
  ErrorLogFilter,
  LoginLogFilter,
  StatsFilter,
} from '@/types/audit.types'

/**
 * Activity logs — CRUD operatsiyalar
 */
export function useActivityLogs(params: ActivityLogFilter = {}) {
  return useQuery({
    queryKey: queryKeys.audit.activities(params as Record<string, unknown>),
    queryFn: () => auditApi.getActivities(params),
  })
}

export function useActivityDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.audit.activityDetail(id),
    queryFn: () => auditApi.getActivityDetail(id),
    enabled: !!id,
  })
}

/**
 * Error logs — Xatolar
 */
export function useErrorLogs(params: ErrorLogFilter = {}) {
  return useQuery({
    queryKey: queryKeys.audit.errors(params as Record<string, unknown>),
    queryFn: () => auditApi.getErrors(params),
  })
}

export function useErrorDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.audit.errorDetail(id),
    queryFn: () => auditApi.getErrorDetail(id),
    enabled: !!id,
  })
}

/**
 * Login logs — Autentifikatsiya hodisalari
 */
export function useLoginLogs(params: LoginLogFilter = {}) {
  return useQuery({
    queryKey: queryKeys.audit.logins(params as Record<string, unknown>),
    queryFn: () => auditApi.getLogins(params),
  })
}

/**
 * Entity history — bitta entity uchun barcha o'zgarishlar
 */
export function useEntityHistory(entityType: string, entityId: string, size = 50) {
  const [page, setPage] = useState(0)
  const query = useQuery({
    queryKey: queryKeys.audit.entityHistory(entityType, entityId, { page, size }),
    queryFn: () => auditApi.getEntityHistory(entityType, entityId, { page, size }),
    enabled: !!entityType && !!entityId,
  })
  return { ...query, page, setPage }
}

/**
 * Audit statistika
 */
export function useAuditStats(params: StatsFilter = {}) {
  return useQuery({
    queryKey: queryKeys.audit.stats(params as Record<string, unknown>),
    queryFn: () => auditApi.getStats(params),
  })
}
