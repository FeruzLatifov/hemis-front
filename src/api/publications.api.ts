// Scientific Publications Registry API Client (read-only)
import apiClient from './client'

export interface PublicationRow {
  id: string
  name?: string
  authors?: string
  authorCounts?: number
  sourceName?: string
  issueYear?: string
  universityCode?: string
  universityName?: string
  publicationTypeCode?: string
  publicationTypeName?: string
  doi?: string
  active: boolean
}

export interface PublicationDetail extends PublicationRow {
  keywords?: string
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

export interface PublicationDictionaries {
  universities: DictionaryOption[]
  publicationTypes: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface PublicationListParams {
  q?: string
  universityCode?: string
  publicationType?: string
  issueYear?: string
  active?: boolean
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/publications'

export const publicationsApi = {
  list: async (
    params: PublicationListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<PublicationRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<PublicationRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<PublicationDetail> => {
    const response = await apiClient.get<Wrapped<PublicationDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<PublicationDictionaries> => {
    const response = await apiClient.get<Wrapped<PublicationDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (params: Omit<PublicationListParams, 'page' | 'size' | 'sort'>): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
