// Scientific (Research) Activity Registry API Client (read-only)
import apiClient from './client'

export interface ResearchActivityRow {
  id: string
  universityCode?: string
  universityName?: string
  educationYear?: string
  scholarDatabaseCode?: string
  scholarDatabaseName?: string
  hIndex?: number
  scientificWorkCount?: number
  referenceCount?: number
  link?: string
}

export type ResearchActivityDetail = ResearchActivityRow

export interface DictionaryOption {
  code: string
  name: string
}

export interface ResearchActivityDictionaries {
  universities: DictionaryOption[]
  scholarDatabases: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ResearchActivityListParams {
  q?: string
  universityCode?: string
  educationYear?: string
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/research-activity'

export const researchActivityApi = {
  list: async (
    params: ResearchActivityListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<ResearchActivityRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<ResearchActivityRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<ResearchActivityDetail> => {
    const response = await apiClient.get<Wrapped<ResearchActivityDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<ResearchActivityDictionaries> => {
    const response = await apiClient.get<Wrapped<ResearchActivityDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (
    params: Omit<ResearchActivityListParams, 'page' | 'size' | 'sort'>,
  ): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
