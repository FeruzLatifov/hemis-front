import apiClient from './client'
import type {
  UniversityDashboard,
  UniversityLegal,
  UniversityFounder,
  UniversityLifecycle,
  UniversityCadastre,
  UniversityOfficial,
  UniversityProfile,
  UniversityProfileRequest,
} from '@/types/university.types'

export const universityApi = {
  async getDashboard(code: string, signal?: AbortSignal): Promise<UniversityDashboard> {
    const response = await apiClient.get<{ success: boolean; data: UniversityDashboard }>(
      `/api/v1/web/university/${code}/dashboard`,
      { signal },
    )
    return response.data.data
  },

  async getLegal(code: string, signal?: AbortSignal): Promise<UniversityLegal | null> {
    const response = await apiClient.get<{ success: boolean; data: UniversityLegal | null }>(
      `/api/v1/web/university/${code}/legal`,
      { signal },
    )
    return response.data.data
  },

  async getFounders(code: string, signal?: AbortSignal): Promise<UniversityFounder[]> {
    const response = await apiClient.get<{ success: boolean; data: UniversityFounder[] }>(
      `/api/v1/web/university/${code}/founders`,
      { signal },
    )
    return response.data.data
  },

  async getLifecycle(code: string, signal?: AbortSignal): Promise<UniversityLifecycle[]> {
    const response = await apiClient.get<{ success: boolean; data: UniversityLifecycle[] }>(
      `/api/v1/web/university/${code}/lifecycle`,
      { signal },
    )
    return response.data.data
  },

  async getCadastre(code: string, signal?: AbortSignal): Promise<UniversityCadastre[]> {
    const response = await apiClient.get<{ success: boolean; data: UniversityCadastre[] }>(
      `/api/v1/web/university/${code}/cadastre`,
      { signal },
    )
    return response.data.data
  },

  async syncAll(code: string): Promise<UniversityDashboard> {
    const response = await apiClient.post<{ success: boolean; data: UniversityDashboard }>(
      `/api/v1/web/university/${code}/sync`,
    )
    return response.data.data
  },

  async getOfficials(
    code: string,
    history = false,
    signal?: AbortSignal,
  ): Promise<UniversityOfficial[]> {
    const response = await apiClient.get<{ success: boolean; data: UniversityOfficial[] }>(
      `/api/v1/web/university/${code}/officials`,
      { params: { history }, signal },
    )
    return response.data.data
  },

  async appointOfficial(
    code: string,
    data: {
      pinfl: string
      firstName: string
      lastName: string
      middleName?: string
      phone?: string
      positionCode: string
      decreeNumber?: string
      decreeDate?: string
    },
  ): Promise<UniversityOfficial> {
    const response = await apiClient.post<{ success: boolean; data: UniversityOfficial }>(
      `/api/v1/web/university/${code}/officials`,
      data,
    )
    return response.data.data
  },

  async removeOfficial(code: string, metaId: string, decree?: string): Promise<void> {
    await apiClient.delete(`/api/v1/web/university/${code}/officials/${metaId}`, {
      params: decree ? { decree } : undefined,
    })
  },

  async lookupPerson(
    pinfl: string,
    document?: string,
    birthDate?: string,
  ): Promise<Record<string, string> | null> {
    const params: Record<string, string> = {}
    if (document) params.document = document
    if (birthDate) params.birthDate = birthDate
    const response = await apiClient.get<{ success: boolean; data: Record<string, string> | null }>(
      `/api/v1/web/university/lookup/person/${pinfl}`,
      { params },
    )
    return response.data.data
  },

  async getPositions(): Promise<Array<{ code: string; name: string }>> {
    const response = await apiClient.get<{
      success: boolean
      data: Array<{ code: string; name: string }>
    }>('/api/v1/web/university/positions')
    return response.data.data
  },

  async getProfile(code: string, signal?: AbortSignal): Promise<UniversityProfile> {
    const response = await apiClient.get<{ success: boolean; data: UniversityProfile }>(
      `/api/v1/web/university/${code}/profile`,
      { signal },
    )
    return response.data.data
  },

  async updateProfile(code: string, data: UniversityProfileRequest): Promise<UniversityProfile> {
    const response = await apiClient.put<{ success: boolean; data: UniversityProfile }>(
      `/api/v1/web/university/${code}/profile`,
      data,
    )
    return response.data.data
  },

  async addLifecycleEvent(
    code: string,
    event: Omit<UniversityLifecycle, 'id' | 'universityCode' | 'createdAt' | 'createdBy'>,
  ): Promise<UniversityLifecycle> {
    const response = await apiClient.post<{ success: boolean; data: UniversityLifecycle }>(
      `/api/v1/web/university/${code}/lifecycle`,
      event,
    )
    return response.data.data
  },
}
