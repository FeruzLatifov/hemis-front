// Student Diplomas Registry API Client (read-only)
import apiClient from './client'

export interface DiplomaRow {
  id: string
  diplomaNumber?: string
  registerNumber?: string
  registerDate?: string
  studentId?: string
  studentName?: string
  universityCode?: string
  universityName?: string
  specialityName?: string
  educationYear?: string
  graduationDate?: string
  avgGrade?: number
  verify?: boolean
  active: boolean
}

export interface DiplomaDetail extends DiplomaRow {
  educationType?: string
  admissionYear?: string
  specialityCode?: string
  totalCredit?: number
  hash?: string
}

export interface DictionaryOption {
  code: string
  name: string
}

export interface DiplomaDictionaries {
  universities: DictionaryOption[]
  educationYears: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface DiplomaListParams {
  q?: string
  universityCode?: string
  educationYear?: string
  verify?: boolean
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/diplomas'

export const diplomasApi = {
  list: async (
    params: DiplomaListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<DiplomaRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<DiplomaRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<DiplomaDetail> => {
    const response = await apiClient.get<Wrapped<DiplomaDetail>>(`${BASE_URL}/${id}`, { signal })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<DiplomaDictionaries> => {
    const response = await apiClient.get<Wrapped<DiplomaDictionaries>>(`${BASE_URL}/dictionaries`, {
      signal,
    })
    return response.data.data
  },

  export: async (params: Omit<DiplomaListParams, 'page' | 'size' | 'sort'>): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
