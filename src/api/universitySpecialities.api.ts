// Institution (University) Specialities Registry API Client (read-only)
import apiClient from './client'

export interface UniversitySpecialityRow {
  id: string
  universityCode?: string
  universityName?: string
  specialityCode?: string
  specialityName?: string
  educationTypeCode?: string
  educationTypeName?: string
  educationYear?: string
  facultyCode?: string
  active: boolean
}

export type UniversitySpecialityDetail = UniversitySpecialityRow

export interface DictionaryOption {
  code: string
  name: string
}

export interface UniversitySpecialityDictionaries {
  universities: DictionaryOption[]
  educationTypes: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface UniversitySpecialityListParams {
  q?: string
  universityCode?: string
  educationType?: string
  active?: boolean
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/university-specialities'

export const universitySpecialitiesApi = {
  list: async (
    params: UniversitySpecialityListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<UniversitySpecialityRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<UniversitySpecialityRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<UniversitySpecialityDetail> => {
    const response = await apiClient.get<Wrapped<UniversitySpecialityDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<UniversitySpecialityDictionaries> => {
    const response = await apiClient.get<Wrapped<UniversitySpecialityDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (
    params: Omit<UniversitySpecialityListParams, 'page' | 'size' | 'sort'>,
  ): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
