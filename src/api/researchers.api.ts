// Researchers (Doctoral Students) Registry API Client (read-only)
import apiClient from './client'

export interface ResearcherRow {
  id: string
  fullName?: string
  studentIdNumber?: string
  universityCode?: string
  universityName?: string
  scienceBranchCode?: string
  scienceBranchName?: string
  doctoralStudentTypeCode?: string
  doctoralStudentTypeName?: string
  statusCode?: string
  statusName?: string
  acceptedDate?: string
  active: boolean
}

export interface ResearcherDetail extends ResearcherRow {
  dissertationTheme?: string
  birthDate?: string
  level?: string
  department?: string
  paymentForm?: string
}

export interface DictionaryOption {
  code: string
  name: string
}

export interface ResearcherDictionaries {
  universities: DictionaryOption[]
  scienceBranches: DictionaryOption[]
  doctoralStudentTypes: DictionaryOption[]
  statuses: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ResearcherListParams {
  q?: string
  universityCode?: string
  scienceBranch?: string
  doctoralStudentType?: string
  status?: string
  active?: boolean
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/researchers'

export const researchersApi = {
  list: async (
    params: ResearcherListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<ResearcherRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<ResearcherRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<ResearcherDetail> => {
    const response = await apiClient.get<Wrapped<ResearcherDetail>>(`${BASE_URL}/${id}`, { signal })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<ResearcherDictionaries> => {
    const response = await apiClient.get<Wrapped<ResearcherDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (params: Omit<ResearcherListParams, 'page' | 'size' | 'sort'>): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
