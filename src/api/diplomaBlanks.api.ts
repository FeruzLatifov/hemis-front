// Diploma Blanks Registry API Client (read-only)
//
// CENTRAL-MINISTRY READ-ONLY registry over the existing `hemishe_e_diploma_blank`
// table. OTMs manage blanks; the ministry views them centrally. No mutations.
// apiClient only — never direct axios/fetch. Response envelope `{ success, data }`.
import apiClient from './client'

export interface DiplomaBlankRow {
  readonly id: string
  readonly blankCode?: string | null
  readonly series?: string | null
  readonly number?: string | null
  readonly universityCode?: string | null
  readonly universityName?: string | null
  readonly blankType?: string | null
  readonly statusCode?: string | null
  readonly receivedDate?: string | null
  readonly issuedDate?: string | null
  readonly academicYear?: string | null
  readonly active: boolean
}

export interface DiplomaBlankDetail extends DiplomaBlankRow {
  readonly supplier?: string | null
  readonly batchNumber?: string | null
  readonly statusReason?: string | null
}

export interface DictionaryOption {
  readonly code: string
  readonly name: string
}

export interface DiplomaBlankDictionaries {
  readonly universities: DictionaryOption[]
  readonly statuses: DictionaryOption[]
}

export interface DiplomaBlankListParams {
  q?: string
  universityCode?: string
  status?: string
  page?: number
  size?: number
  sort?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/diploma-blanks'

export const diplomaBlanksApi = {
  list: async (
    params: DiplomaBlankListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<DiplomaBlankRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<DiplomaBlankRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<DiplomaBlankDetail> => {
    const response = await apiClient.get<Wrapped<DiplomaBlankDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<DiplomaBlankDictionaries> => {
    const response = await apiClient.get<Wrapped<DiplomaBlankDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (params: Omit<DiplomaBlankListParams, 'page' | 'size' | 'sort'>): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
