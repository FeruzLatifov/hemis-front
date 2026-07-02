// Employee Jobs Registry API Client (read-only)
import apiClient from './client'

export interface EmployeeJobRow {
  id: string
  employeeId?: string
  employeeName?: string
  universityCode?: string
  universityName?: string
  departmentCode?: string
  departmentName?: string
  employeeTypeCode?: string
  employeeTypeName?: string
  positionCode?: string
  positionName?: string
  statusCode?: string
  statusName?: string
  jobStartDate?: string
  jobEndDate?: string
  active: boolean
}

export interface EmployeeJobDetail extends EmployeeJobRow {
  employeeFormCode?: string
  employeeFormName?: string
  rate?: number
  contractNumber?: string
  contractDate?: string
  decreeNumber?: string
  decreeDate?: string
}

export interface DictionaryOption {
  code: string
  name: string
}

export interface EmployeeJobDictionaries {
  universities: DictionaryOption[]
  employeeTypes: DictionaryOption[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface EmployeeJobListParams {
  q?: string
  universityCode?: string
  employeeType?: string
  active?: boolean
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/employee-jobs'

export const employeeJobsApi = {
  list: async (
    params: EmployeeJobListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<EmployeeJobRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<EmployeeJobRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<EmployeeJobDetail> => {
    const response = await apiClient.get<Wrapped<EmployeeJobDetail>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  getDictionaries: async (signal?: AbortSignal): Promise<EmployeeJobDictionaries> => {
    const response = await apiClient.get<Wrapped<EmployeeJobDictionaries>>(
      `${BASE_URL}/dictionaries`,
      { signal },
    )
    return response.data.data
  },

  export: async (params: Omit<EmployeeJobListParams, 'page' | 'size' | 'sort'>): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
