// Faculty Registry API Client
import apiClient from './client';

export interface FacultyGroupRow {
  universityCode: string;
  universityName: string;
  facultyCount: number;
  activeFacultyCount: number;
  inactiveFacultyCount: number;
  hasChildren: boolean;
}

export interface FacultyRow {
  code: string;
  nameUz: string;
  nameRu?: string;
  shortName?: string;
  universityCode: string;
  universityName: string;
  status: boolean;
  parentCode?: string;
}

export interface FacultyDetail {
  code: string;
  nameUz: string;
  nameRu?: string;
  shortName?: string;
  universityCode: string;
  universityName: string;
  status: boolean;
  departmentType?: string;
  departmentTypeName?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  parentCode?: string;
  path?: string;
  version?: number;
}

export interface FacultyDictionaries {
  statuses: DictionaryItem[];
}

export interface DictionaryItem {
  value: boolean;
  labelKey: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

type Wrapped<T> = { success: boolean; data: T };

const BASE_URL = '/api/v1/web/registry/faculties';

export const facultiesApi = {
  // Get university groups (root level)
  getGroups: async (params: {
    q?: string;
    status?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<FacultyGroupRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<FacultyGroupRow>>>(
      `${BASE_URL}/groups`,
      { params }
    );
    return response.data.data;
  },

  // Get faculties by university (children level)
  getFacultiesByUniversity: async (
    universityId: string,
    params: {
      q?: string;
      status?: boolean;
      page?: number;
      size?: number;
    }
  ): Promise<PageResponse<FacultyRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<FacultyRow>>>(
      `${BASE_URL}/by-university/${universityId}`,
      { params }
    );
    return response.data.data;
  },

  // Get faculty detail
  getFacultyDetail: async (id: string): Promise<FacultyDetail> => {
    const response = await apiClient.get<Wrapped<FacultyDetail>>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  // Get dictionaries
  getDictionaries: async (): Promise<FacultyDictionaries> => {
    const response = await apiClient.get<Wrapped<FacultyDictionaries>>(
      `${BASE_URL}/dictionaries`
    );
    return response.data.data;
  },

  // Export to Excel
  exportFaculties: async (params: {
    q?: string;
    status?: boolean;
    universityCode?: string;
  }): Promise<Blob> => {
    const response = await apiClient.post(`${BASE_URL}/export`, null, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
 