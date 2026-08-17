import apiClient from './client'
import type {
  UserAdmin,
  UserCreateRequest,
  UserUpdateRequest,
  ChangePasswordRequest,
  RoleSummary,
  UsersParams,
  GovPerson,
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

  /**
   * Resolve person data (name, birth date, passport, address, ...) from the GUVD/api_mspd
   * gateway to autofill the person-create form. Returns null when not found.
   */
  async personLookup(
    pinfl: string,
    document?: string,
    birthDate?: string,
  ): Promise<GovPerson | null> {
    // POST (not GET): PINFL + passport are PII — the backend takes them in the body so they
    // never reach the URL query-string (which nginx/proxies log). Read-only despite POST.
    const response = await apiClient.post<{ success: boolean; data: GovPerson | null }>(
      '/api/v1/web/admin/users/person-lookup',
      { pinfl, document: document || undefined, birthDate: birthDate || undefined },
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
