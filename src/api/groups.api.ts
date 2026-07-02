// Study Groups Registry API Client (read-only)
import apiClient from './client'

export interface GroupGroupRow {
  universityCode: string
  universityName: string
  groupCount: number
  activeGroupCount: number
  inactiveGroupCount: number
  hasChildren: boolean
}

export interface GroupRegistryRow {
  id: string
  groupId: string
  groupName: string
  universityCode: string
  universityName: string
  educationTypeCode?: string
  educationTypeName?: string
  educationYearCode?: string
  educationYearName?: string
  active: boolean
}

// Detail shares the same fields as the registry row — the underlying table has
// no audit columns, so there is no created/updated block.
export type GroupDetail = GroupRegistryRow

export interface DictionaryOption {
  code: string
  name: string
}

export interface DictionaryItem {
  value: boolean
  labelKey: string
}

export interface GroupDictionaries {
  educationTypes: DictionaryOption[]
  educationYears: DictionaryOption[]
  statuses: DictionaryItem[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/groups'

export const groupsApi = {
  // Get university groups (root level of the tree)
  getGroupGroups: async (
    params: {
      q?: string
      status?: boolean
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ): Promise<PageResponse<GroupGroupRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<GroupGroupRow>>>(
      `${BASE_URL}/groups`,
      { params, signal },
    )
    return response.data.data
  },

  // Get groups by university (children level)
  getGroupsByUniversity: async (
    universityCode: string,
    params: {
      q?: string
      educationType?: string
      educationYear?: string
      status?: boolean
      page?: number
      size?: number
    },
    signal?: AbortSignal,
  ): Promise<PageResponse<GroupRegistryRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<GroupRegistryRow>>>(
      `${BASE_URL}/by-university/${universityCode}`,
      { params, signal },
    )
    return response.data.data
  },

  // Get group detail
  getGroupDetail: async (id: string, signal?: AbortSignal): Promise<GroupDetail> => {
    const response = await apiClient.get<Wrapped<GroupDetail>>(`${BASE_URL}/${id}`, { signal })
    return response.data.data
  },

  // Get dictionaries
  getDictionaries: async (signal?: AbortSignal): Promise<GroupDictionaries> => {
    const response = await apiClient.get<Wrapped<GroupDictionaries>>(`${BASE_URL}/dictionaries`, {
      signal,
    })
    return response.data.data
  },

  // Export to CSV
  exportGroups: async (params: {
    q?: string
    educationType?: string
    educationYear?: string
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
