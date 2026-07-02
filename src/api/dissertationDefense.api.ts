// Dissertation Defense Registry API Client (read-only)
import apiClient from './client'

export interface DissertationDefenseRow {
  id: string
  doctorateStudentId?: string
  studentName?: string
  universityCode?: string
  universityName?: string
  specialityCode?: string
  defenseDate?: string
  diplomaNumber?: string
  registerNumber?: string
  approvedDate?: string
  active: boolean
}

export interface DissertationDefenseDetail extends DissertationDefenseRow {
  defensePlace?: string
  diplomaGivenDate?: string
  diplomaGivenByWhom?: string
}

export interface DictionaryOption {
  code: string
  name: string
}

export interface DissertationDefenseDictionaries {
  universities: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface DissertationDefenseListParams {
  q?: string
  universityCode?: string
  active?: boolean
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/dissertation-defense'

export const dissertationDefenseApi = {
  list: async (
    params: DissertationDefenseListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<DissertationDefenseRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<DissertationDefenseRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<DissertationDefenseDetail> => {
    const response = await apiClient.get<Wrapped<DissertationDefenseDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<DissertationDefenseDictionaries> => {
    const response = await apiClient.get<Wrapped<DissertationDefenseDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (
    params: Omit<DissertationDefenseListParams, 'page' | 'size' | 'sort'>,
  ): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
