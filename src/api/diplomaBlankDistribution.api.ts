// Diploma Blank Distribution Registry API Client
//
// CENTRAL-MINISTRY CRUD over the new central `diploma_blank_distribution` table.
// The ministry allocates serial-number ranges of diploma blanks to OTMs centrally
// (no fanout — OTMs read via existing legacy endpoints). apiClient only.
// Response envelope `{ success, data }`.
import apiClient from './client'

export interface DiplomaBlankDistributionRow {
  readonly id: string
  readonly universityCode: string
  readonly universityName?: string | null
  readonly educationYear?: string | null
  readonly educationYearName?: string | null
  readonly educationType?: string | null
  readonly educationTypeName?: string | null
  readonly blankCategory?: string | null
  readonly blankCategoryName?: string | null
  readonly blankSeria: string
  readonly blankStartNumber: number
  readonly blankEndNumber: number
  readonly quantity: number
  readonly generateStatusCode?: string | null
  readonly generateStatusName?: string | null
  readonly distributionDate?: string | null
  readonly note?: string | null
}

export interface DiplomaBlankDistributionDetail extends DiplomaBlankDistributionRow {
  readonly createdAt?: string | null
  readonly updatedAt?: string | null
}

export interface DiplomaBlankDistributionCreate {
  universityCode: string
  educationYear?: string | null
  educationType?: string | null
  blankCategory?: string | null
  blankSeria: string
  blankStartNumber: number
  blankEndNumber: number
  generateStatusCode?: string | null
  distributionDate?: string | null
  note?: string | null
}

export type DiplomaBlankDistributionUpdate = DiplomaBlankDistributionCreate

export interface DictionaryOption {
  readonly code: string
  readonly name: string
}

export interface DiplomaBlankDistributionDictionaries {
  readonly universities: DictionaryOption[]
  readonly educationYears: DictionaryOption[]
  readonly educationTypes: DictionaryOption[]
  readonly blankCategories: DictionaryOption[]
  readonly generateStatuses: DictionaryOption[]
}

export interface DiplomaBlankDistributionParams {
  q?: string
  universityCode?: string
  educationYear?: string
  blankCategory?: string
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

const BASE_URL = '/api/v1/web/registry/diploma-blank-distribution'

export const diplomaBlankDistributionApi = {
  list: async (
    params: DiplomaBlankDistributionParams = {},
    signal?: AbortSignal,
  ): Promise<PageResponse<DiplomaBlankDistributionRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<DiplomaBlankDistributionRow>>>(
      BASE_URL,
      { params, signal },
    )
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<DiplomaBlankDistributionDetail> => {
    const response = await apiClient.get<Wrapped<DiplomaBlankDistributionDetail>>(
      `${BASE_URL}/${id}`,
      { signal },
    )
    return response.data.data
  },

  create: async (dto: DiplomaBlankDistributionCreate): Promise<DiplomaBlankDistributionDetail> => {
    const response = await apiClient.post<Wrapped<DiplomaBlankDistributionDetail>>(BASE_URL, dto)
    return response.data.data
  },

  update: async (
    id: string,
    dto: DiplomaBlankDistributionUpdate,
  ): Promise<DiplomaBlankDistributionDetail> => {
    const response = await apiClient.put<Wrapped<DiplomaBlankDistributionDetail>>(
      `${BASE_URL}/${id}`,
      dto,
    )
    return response.data.data
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`)
  },

  getDictionaries: async (signal?: AbortSignal): Promise<DiplomaBlankDistributionDictionaries> => {
    const response = await apiClient.get<Wrapped<DiplomaBlankDistributionDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (
    params: Omit<DiplomaBlankDistributionParams, 'page' | 'size' | 'sort'> = {},
  ): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
