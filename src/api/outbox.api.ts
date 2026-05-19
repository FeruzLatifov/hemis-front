import apiClient from './client'
import type { PagedResponse } from '@/api/universities.api'
import type { OutboxEventDto, OutboxStatsDto, OutboxListParams } from '@/types/outbox.types'

const BASE = '/api/v1/web/admin/outbox'

export const outboxApi = {
  async list(
    params: OutboxListParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<OutboxEventDto>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<OutboxEventDto>
    }>(BASE, { params, signal })
    return response.data.data
  },

  async stats(signal?: AbortSignal): Promise<OutboxStatsDto> {
    const response = await apiClient.get<{ success: boolean; data: OutboxStatsDto }>(
      `${BASE}/stats`,
      { signal },
    )
    return response.data.data
  },

  async getById(id: string, signal?: AbortSignal): Promise<OutboxEventDto> {
    const response = await apiClient.get<{ success: boolean; data: OutboxEventDto }>(
      `${BASE}/${id}`,
      { signal },
    )
    return response.data.data
  },

  async retry(id: string): Promise<OutboxEventDto> {
    const response = await apiClient.post<{ success: boolean; data: OutboxEventDto }>(
      `${BASE}/${id}/retry`,
    )
    return response.data.data
  },

  async discard(id: string, reason?: string): Promise<OutboxEventDto> {
    const response = await apiClient.post<{ success: boolean; data: OutboxEventDto }>(
      `${BASE}/${id}/discard`,
      undefined,
      { params: reason ? { reason } : undefined },
    )
    return response.data.data
  },
}
