import apiClient from './client'
import type { PagedResponse } from '@/api/universities.api'
import type {
  WebhookTargetDto,
  WebhookTargetCreateRequest,
  WebhookTargetUpdateRequest,
  WebhookSecretResponse,
  WebhookDeliveryLogDto,
  WebhookDeliveriesParams,
} from '@/types/webhook.types'

const BASE = '/api/v1/web/admin/webhooks'

export const webhooksApi = {
  async listAll(signal?: AbortSignal): Promise<WebhookTargetDto[]> {
    const response = await apiClient.get<{
      success: boolean
      data: WebhookTargetDto[]
    }>(BASE, { signal })
    return response.data.data
  },

  async getById(id: string, signal?: AbortSignal): Promise<WebhookTargetDto> {
    const response = await apiClient.get<{ success: boolean; data: WebhookTargetDto }>(
      `${BASE}/${id}`,
      { signal },
    )
    return response.data.data
  },

  async getByUniversity(universityCode: string, signal?: AbortSignal): Promise<WebhookTargetDto> {
    const response = await apiClient.get<{ success: boolean; data: WebhookTargetDto }>(
      `${BASE}/by-university/${universityCode}`,
      { signal },
    )
    return response.data.data
  },

  async create(data: WebhookTargetCreateRequest): Promise<WebhookSecretResponse> {
    const response = await apiClient.post<{ success: boolean; data: WebhookSecretResponse }>(
      BASE,
      data,
    )
    return response.data.data
  },

  async update(id: string, data: WebhookTargetUpdateRequest): Promise<WebhookTargetDto> {
    const response = await apiClient.put<{ success: boolean; data: WebhookTargetDto }>(
      `${BASE}/${id}`,
      data,
    )
    return response.data.data
  },

  async regenerateSecret(id: string): Promise<WebhookSecretResponse> {
    const response = await apiClient.post<{ success: boolean; data: WebhookSecretResponse }>(
      `${BASE}/${id}/regenerate-secret`,
    )
    return response.data.data
  },

  async deleteTarget(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },

  async sendTestEvent(id: string): Promise<WebhookDeliveryLogDto> {
    const response = await apiClient.post<{ success: boolean; data: WebhookDeliveryLogDto }>(
      `${BASE}/${id}/test`,
    )
    return response.data.data
  },

  async listDeliveries(
    id: string,
    params: WebhookDeliveriesParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<WebhookDeliveryLogDto>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<WebhookDeliveryLogDto>
    }>(`${BASE}/${id}/deliveries`, { params, signal })
    return response.data.data
  },

  async listDeliveriesByEvent(
    eventId: string,
    signal?: AbortSignal,
  ): Promise<WebhookDeliveryLogDto[]> {
    const response = await apiClient.get<{
      success: boolean
      data: WebhookDeliveryLogDto[]
    }>(`${BASE}/events/${eventId}/deliveries`, { signal })
    return response.data.data
  },

  async listDlq(
    params: WebhookDeliveriesParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<WebhookDeliveryLogDto>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<WebhookDeliveryLogDto>
    }>(`${BASE}/dlq`, { params, signal })
    return response.data.data
  },
}
