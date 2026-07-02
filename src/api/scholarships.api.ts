// Student Scholarships Registry API Client (read-only)
import apiClient from './client'

export interface ScholarshipRow {
  id: string
  studentId?: string
  studentName?: string
  universityCode?: string
  universityName?: string
  educationYear?: string
  semesterNumber?: number
  stipendCategory?: string
  stipendType?: string
  paymentForm?: string
  decree?: string
  startDate?: string
  endDate?: string
  active: boolean
}

export interface ScholarshipAmount {
  month?: string
  amount?: number
}

export interface ScholarshipDetail extends ScholarshipRow {
  educationType?: string
  educationForm?: string
  semester?: string
  amounts?: ScholarshipAmount[]
}

export interface DictionaryOption {
  code: string
  name: string
}

export interface ScholarshipDictionaries {
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

export interface ScholarshipListParams {
  q?: string
  universityCode?: string
  educationYear?: string
  stipendCategory?: string
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/scholarships'

export const scholarshipsApi = {
  list: async (
    params: ScholarshipListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<ScholarshipRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<ScholarshipRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<ScholarshipDetail> => {
    const response = await apiClient.get<Wrapped<ScholarshipDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<ScholarshipDictionaries> => {
    const response = await apiClient.get<Wrapped<ScholarshipDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (params: Omit<ScholarshipListParams, 'page' | 'size' | 'sort'>): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
