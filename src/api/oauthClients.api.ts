import apiClient from './client'
import type {
  OAuthClientAdmin,
  OAuthClientCreateRequest,
  OAuthClientsParams,
} from '@/types/oauthClient.types'
import type { PagedResponse } from '@/api/universities.api'

export const oauthClientsApi = {
  async getClients(
    params: OAuthClientsParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<OAuthClientAdmin>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<OAuthClientAdmin>
    }>('/api/v1/web/admin/oauth-clients', { params, signal })
    return response.data.data
  },

  async getClient(id: string, signal?: AbortSignal): Promise<OAuthClientAdmin> {
    const response = await apiClient.get<{ success: boolean; data: OAuthClientAdmin }>(
      `/api/v1/web/admin/oauth-clients/${id}`,
      { signal },
    )
    return response.data.data
  },

  async createClient(data: OAuthClientCreateRequest): Promise<OAuthClientAdmin> {
    const response = await apiClient.post<{ success: boolean; data: OAuthClientAdmin }>(
      '/api/v1/web/admin/oauth-clients',
      data,
    )
    return response.data.data
  },

  async toggleStatus(id: string): Promise<OAuthClientAdmin> {
    const response = await apiClient.patch<{ success: boolean; data: OAuthClientAdmin }>(
      `/api/v1/web/admin/oauth-clients/${id}/status`,
    )
    return response.data.data
  },

  async deleteClient(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/web/admin/oauth-clients/${id}`)
  },
}
