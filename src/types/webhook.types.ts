/**
 * Webhook Target Admin Types
 *
 * Synced with Backend:
 *   - uz.hemis.common.dto.webhook.WebhookTargetDto
 *   - uz.hemis.common.dto.webhook.WebhookTargetCreateRequest
 *   - uz.hemis.common.dto.webhook.WebhookTargetUpdateRequest
 *   - uz.hemis.common.dto.webhook.WebhookDeliveryLogDto
 *   - uz.hemis.common.dto.webhook.WebhookSecretResponse
 *
 * ADR-0012.
 */

export interface WebhookTargetDto {
  id: string
  universityCode: string
  callbackUrl: string | null
  description: string | null
  active: boolean | null
  timeoutMs: number | null
  maxRetries: number | null
  createdAt: string
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export interface WebhookTargetCreateRequest {
  universityCode: string
  description?: string
  timeoutMs?: number
  maxRetries?: number
}

export interface WebhookTargetUpdateRequest {
  description?: string
  timeoutMs?: number
  maxRetries?: number
}

export interface WebhookSecretResponse {
  targetId: string
  universityCode: string
  plainSecret: string
  createdAt: string
  warning: string
}

export type WebhookDeliveryStatus = 'PENDING' | 'IN_FLIGHT' | 'SUCCESS' | 'FAILED' | 'DLQ'

export interface WebhookDeliveryLogDto {
  id: string
  eventId: string
  eventType: string | null
  universityCode: string | null
  attemptN: number | null
  httpStatus: number | null
  responseBody: string | null
  errorMessage: string | null
  durationMs: number | null
  status: WebhookDeliveryStatus | string
  dispatchedAt: string | null
  completedAt: string | null
  nextRetryAt: string | null
}

export interface WebhookDeliveriesParams {
  page?: number
  size?: number
  sort?: string
}
