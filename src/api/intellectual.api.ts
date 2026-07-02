// Intellectual Property Registry API Client (read-only)
import apiClient from './client'

export interface IntellectualRow {
  id: string
  name?: string
  authors?: string
  authorCounts?: number
  universityCode?: string
  universityName?: string
  patentTypeCode?: string
  patentTypeName?: string
  numbers?: string
  propertyDate?: string
  countryCode?: string
  active: boolean
}

export interface IntellectualDetail extends IntellectualRow {
  parameter?: string
  publicationDatabaseCode?: string
  publicationDatabaseName?: string
  educationYear?: string
  isChecked?: boolean
}

export interface DictionaryOption {
  code: string
  name: string
}

export interface IntellectualDictionaries {
  universities: DictionaryOption[]
  patentTypes: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface IntellectualListParams {
  q?: string
  universityCode?: string
  patentType?: string
  active?: boolean
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/intellectual'

export const intellectualApi = {
  list: async (
    params: IntellectualListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<IntellectualRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<IntellectualRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<IntellectualDetail> => {
    const response = await apiClient.get<Wrapped<IntellectualDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<IntellectualDictionaries> => {
    const response = await apiClient.get<Wrapped<IntellectualDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (params: Omit<IntellectualListParams, 'page' | 'size' | 'sort'>): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
