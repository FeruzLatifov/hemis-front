import apiClient from './client'
import type {
  UserAdmin,
  UserCreateRequest,
  UserUpdateRequest,
  ChangePasswordRequest,
  RoleSummary,
  UsersParams,
} from '@/types/user.types'
import type { PagedResponse } from '@/api/universities.api'

export const usersApi = {
  async getUsers(
    params: UsersParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<UserAdmin>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<UserAdmin>
    }>('/api/v1/web/admin/users', { params, signal })
    return response.data.data
  },

  async getUserById(id: string, signal?: AbortSignal): Promise<UserAdmin> {
    const response = await apiClient.get<{ success: boolean; data: UserAdmin }>(
      `/api/v1/web/admin/users/${id}`,
      { signal },
    )
    return response.data.data
  },

  async createUser(data: UserCreateRequest): Promise<UserAdmin> {
    const response = await apiClient.post<{ success: boolean; data: UserAdmin }>(
      '/api/v1/web/admin/users',
      data,
    )
    return response.data.data
  },

  async updateUser(id: string, data: UserUpdateRequest): Promise<UserAdmin> {
    const response = await apiClient.put<{ success: boolean; data: UserAdmin }>(
      `/api/v1/web/admin/users/${id}`,
      data,
    )
    return response.data.data
  },

  async changePassword(id: string, data: ChangePasswordRequest): Promise<void> {
    await apiClient.patch(`/api/v1/web/admin/users/${id}/password`, data)
  },

  async toggleStatus(id: string): Promise<UserAdmin> {
    const response = await apiClient.patch<{ success: boolean; data: UserAdmin }>(
      `/api/v1/web/admin/users/${id}/status`,
    )
    return response.data.data
  },

  async unlockAccount(id: string): Promise<UserAdmin> {
    const response = await apiClient.patch<{ success: boolean; data: UserAdmin }>(
      `/api/v1/web/admin/users/${id}/unlock`,
    )
    return response.data.data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/web/admin/users/${id}`)
  },

  async getRoles(signal?: AbortSignal): Promise<RoleSummary[]> {
    const response = await apiClient.get<{ success: boolean; data: RoleSummary[] }>(
      '/api/v1/web/admin/users/roles',
      { signal },
    )
    return response.data.data
  },

  async getRolePermissions(id: string, signal?: AbortSignal): Promise<string[]> {
    const response = await apiClient.get<{ success: boolean; data: string[] }>(
      `/api/v1/web/admin/users/roles/${id}/permissions`,
      { signal },
    )
    return response.data.data
  },
}
