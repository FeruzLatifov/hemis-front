// Methodical Publications Registry API Client (read-only)
import apiClient from './client'

export interface MethodicalRow {
  id: string
  name?: string
  authors?: string
  authorCounts?: number
  publisher?: string
  issueYear?: string
  sourceName?: string
  universityCode?: string
  universityName?: string
  methodicalTypeCode?: string
  methodicalTypeName?: string
  active: boolean
}

export interface MethodicalDetail extends MethodicalRow {
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

export interface MethodicalDictionaries {
  universities: DictionaryOption[]
  methodicalTypes: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface MethodicalListParams {
  q?: string
  universityCode?: string
  methodicalType?: string
  issueYear?: string
  active?: boolean
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/methodical'

export const methodicalApi = {
  list: async (
    params: MethodicalListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<MethodicalRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<MethodicalRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<MethodicalDetail> => {
    const response = await apiClient.get<Wrapped<MethodicalDetail>>(`${BASE_URL}/${id}`, { signal })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<MethodicalDictionaries> => {
    const response = await apiClient.get<Wrapped<MethodicalDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (params: Omit<MethodicalListParams, 'page' | 'size' | 'sort'>): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
