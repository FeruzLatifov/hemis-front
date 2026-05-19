/**
 * Outbox Admin Types
 *
 * Synced with Backend:
 *   - uz.hemis.common.dto.outbox.OutboxEventDto
 *   - uz.hemis.common.dto.outbox.OutboxStatsDto
 *
 * ADR-0007 (Sync Architecture), 2026-05-19 admin observability.
 */

export type OutboxStatus = 'PENDING' | 'RETRYING' | 'DLQ' | 'PUBLISHED'

export interface OutboxEventDto {
  id: string
  aggregateType: string
  aggregateId: string
  eventType: string
  schemaVersion: number | null
  topic: string | null
  payloadPreview: string | null
  occurredAt: string
  publishedAt: string | null
  retryCount: number | null
  lastError: string | null
  correlationId: string | null
  causationId: string | null
  createdBy: string | null
  status: OutboxStatus | string
}

export interface OutboxStatsDto {
  total: number
  pending: number
  published: number
  dlq: number
  oldestPendingMinutes: number
}

export interface OutboxListParams {
  status?: string
  aggregateType?: string
  page?: number
  size?: number
  sort?: string
}
