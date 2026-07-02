// University Attached Specialities Registry API Client
//
// CENTRAL-MINISTRY CRUD: the ministry attaches classifier specialities to
// universities. Mirrors the University CRUD card transport (ResponseWrapper
// `{ success, data }` envelope, apiClient only — never direct axios/fetch).
import apiClient from './client'

/** Which of the four `_speciality_*` UUID columns a row targets. */
export type SpecialityLevel = 'BACHELOR' | 'MASTER' | 'ORDINATURA' | 'DOCTORAL'

export interface AttachedSpecialityRow {
  readonly id: string
  readonly universityCode: string
  readonly universityName: string
  readonly educationType: string
  readonly educationTypeName: string
  readonly educationForm?: string | null
  readonly educationFormName?: string | null
  readonly specialityLevel: SpecialityLevel
  readonly specialityId: string
  readonly specialityName: string
  readonly active: boolean
}

export interface AttachedSpecialityDetail extends AttachedSpecialityRow {
  readonly createdAt?: string
  readonly updatedAt?: string
}

export interface AttachedSpecialityCreate {
  universityCode: string
  educationType: string
  educationForm?: string | null
  specialityLevel: SpecialityLevel
  specialityId: string
  active: boolean
}

export type AttachedSpecialityUpdate = AttachedSpecialityCreate

export interface DictionaryOption {
  readonly code: string
  readonly name: string
}

export interface SpecialityOption {
  readonly id: string
  readonly name: string
}

export interface AttachedSpecialityDictionaries {
  readonly universities: DictionaryOption[]
  readonly educationTypes: DictionaryOption[]
  readonly educationForms: DictionaryOption[]
  readonly specialities: Record<SpecialityLevel, SpecialityOption[]>
}

export interface AttachedSpecialitiesParams {
  page?: number
  size?: number
  sort?: string
  q?: string
  universityCode?: string
  educationType?: string
  educationForm?: string
  active?: boolean
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/attached-specialities'

export const attachedSpecialitiesApi = {
  list: async (
    params: AttachedSpecialitiesParams = {},
    signal?: AbortSignal,
  ): Promise<PageResponse<AttachedSpecialityRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<AttachedSpecialityRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<AttachedSpecialityDetail> => {
    const response = await apiClient.get<Wrapped<AttachedSpecialityDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  create: async (dto: AttachedSpecialityCreate): Promise<AttachedSpecialityDetail> => {
    const response = await apiClient.post<Wrapped<AttachedSpecialityDetail>>(BASE_URL, dto)
    return response.data.data
  },

  update: async (id: string, dto: AttachedSpecialityUpdate): Promise<AttachedSpecialityDetail> => {
    const response = await apiClient.put<Wrapped<AttachedSpecialityDetail>>(
      `${BASE_URL}/${id}`,
      dto,
    )
    return response.data.data
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`)
  },

  getDictionaries: async (signal?: AbortSignal): Promise<AttachedSpecialityDictionaries> => {
    const response = await apiClient.get<Wrapped<AttachedSpecialityDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (
    params: Omit<AttachedSpecialitiesParams, 'page' | 'size' | 'sort'> = {},
  ): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
