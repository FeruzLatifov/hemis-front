// Department Registry API Client
import apiClient from './client'

export interface DepartmentGroupRow {
  universityCode: string
  universityName: string
  departmentCount: number
  activeDepartmentCount: number
  inactiveDepartmentCount: number
  hasChildren: boolean
}

export interface DepartmentRow {
  code: string
  nameUz: string
  nameRu?: string
  shortName?: string
  universityCode: string
  universityName: string
  status: boolean
  parentCode?: string
}

export interface DepartmentDetail {
  code: string
  nameUz: string
  nameRu?: string
  shortName?: string
  universityCode: string
  universityName: string
  status: boolean
  departmentType?: string
  departmentTypeName?: string
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  parentCode?: string
  path?: string
  version?: number
}

export interface DepartmentDictionaries {
  statuses: DictionaryItem[]
}

export interface DictionaryItem {
  value: boolean
  labelKey: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/departments'

export const departmentsApi = {
  // Get university groups (root level)
  getGroups: async (
    params: {
      q?: string
      status?: boolean
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ): Promise<PageResponse<DepartmentGroupRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<DepartmentGroupRow>>>(
      `${BASE_URL}/groups`,
      { params, signal },
    )
    return response.data.data
  },

  // Get departments by university (children level)
  getDepartmentsByUniversity: async (
    universityId: string,
    params: {
      q?: string
      status?: boolean
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ): Promise<PageResponse<DepartmentRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<DepartmentRow>>>(
      `${BASE_URL}/by-university/${universityId}`,
      { params, signal },
    )
    return response.data.data
  },

  // Get department detail
  getDepartmentDetail: async (id: string, signal?: AbortSignal): Promise<DepartmentDetail> => {
    const response = await apiClient.get<Wrapped<DepartmentDetail>>(`${BASE_URL}/${id}`, { signal })
    return response.data.data
  },

  // Get dictionaries
  getDictionaries: async (signal?: AbortSignal): Promise<DepartmentDictionaries> => {
    const response = await apiClient.get<Wrapped<DepartmentDictionaries>>(
      `${BASE_URL}/dictionaries`,
      {
        signal,
      },
    )
    return response.data.data
  },

  // Export to Excel
  exportDepartments: async (params: {
    q?: string
    status?: boolean
    universityCode?: string
  }): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
