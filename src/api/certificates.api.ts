// Student Certificates Registry API Client (read-only)
import apiClient from './client'

export interface CertificateRow {
  id: string
  studentId?: string
  studentName?: string
  universityCode?: string
  universityName?: string
  certificateType?: string
  certificateTypeName?: string
  certificateName?: string
  certificateNameLabel?: string
  certificateGrade?: string
  certificateGradeName?: string
  serialNumber?: string
  issueDate?: string
  validDate?: string
  active: boolean
}

export interface CertificateDetail extends CertificateRow {
  certificateSubject?: string
  certificateSubjectName?: string
}

export interface DictionaryOption {
  code: string
  name: string
}

export interface CertificateDictionaries {
  universities: DictionaryOption[]
  certificateTypes: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface CertificateListParams {
  q?: string
  universityCode?: string
  certificateType?: string
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/certificates'

export const certificatesApi = {
  list: async (
    params: CertificateListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<CertificateRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<CertificateRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<CertificateDetail> => {
    const response = await apiClient.get<Wrapped<CertificateDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<CertificateDictionaries> => {
    const response = await apiClient.get<Wrapped<CertificateDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (params: Omit<CertificateListParams, 'page' | 'size' | 'sort'>): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
