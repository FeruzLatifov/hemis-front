// Scientific Projects Registry API Client (read-only)
import apiClient from './client'

export interface ScientificProjectRow {
  id: string
  name?: string
  projectNumber?: string
  universityCode?: string
  universityName?: string
  projectTypeCode?: string
  projectTypeName?: string
  contractNumber?: string
  contractDate?: string
  startDate?: string
  endDate?: string
  active: boolean
}

export interface ScientificProjectDetail extends ScientificProjectRow {
  department?: string
  localityCode?: string
  localityName?: string
  projectCurrencyCode?: string
  projectCurrencyName?: string
}

export interface DictionaryOption {
  code: string
  name: string
}

export interface ScientificProjectDictionaries {
  universities: DictionaryOption[]
  projectTypes: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ScientificProjectListParams {
  q?: string
  universityCode?: string
  projectType?: string
  active?: boolean
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/scientific-projects'

export const scientificProjectsApi = {
  list: async (
    params: ScientificProjectListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<ScientificProjectRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<ScientificProjectRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<ScientificProjectDetail> => {
    const response = await apiClient.get<Wrapped<ScientificProjectDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<ScientificProjectDictionaries> => {
    const response = await apiClient.get<Wrapped<ScientificProjectDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (
    params: Omit<ScientificProjectListParams, 'page' | 'size' | 'sort'>,
  ): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
