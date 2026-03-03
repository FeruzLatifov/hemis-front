import apiClient from './client'
import type { PagedResponse } from '@/api/universities.api'
import type {
  RoleAdmin,
  RoleCreateRequest,
  RoleUpdateRequest,
  RolesParams,
  PermissionItem,
} from '@/types/role.types'

export const rolesApi = {
  async getRoles(
    params: RolesParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<RoleAdmin>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<RoleAdmin>
    }>('/api/v1/web/admin/roles', { params, signal })
    return response.data.data
  },

  async getRoleById(id: string, signal?: AbortSignal): Promise<RoleAdmin> {
    const response = await apiClient.get<{ success: boolean; data: RoleAdmin }>(
      `/api/v1/web/admin/roles/${id}`,
      { signal },
    )
    return response.data.data
  },

  async createRole(data: RoleCreateRequest): Promise<RoleAdmin> {
    const response = await apiClient.post<{ success: boolean; data: RoleAdmin }>(
      '/api/v1/web/admin/roles',
      data,
    )
    return response.data.data
  },

  async updateRole(id: string, data: RoleUpdateRequest): Promise<RoleAdmin> {
    const response = await apiClient.put<{ success: boolean; data: RoleAdmin }>(
      `/api/v1/web/admin/roles/${id}`,
      data,
    )
    return response.data.data
  },

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/web/admin/roles/${id}`)
  },

  async getAllPermissions(signal?: AbortSignal): Promise<PermissionItem[]> {
    const response = await apiClient.get<{ success: boolean; data: PermissionItem[] }>(
      '/api/v1/web/admin/roles/permissions',
      { signal },
    )
    return response.data.data
  },
}
