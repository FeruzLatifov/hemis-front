// Faculty Registry API Client
import apiClient from './client';

export interface FacultyGroupRow {
  universityId: string;
  universityName: string;
  facultyCount: number;
  statusSummary: string;
  hasChildren: boolean;
}

export interface FacultyRow {
  id: string;
  code: string;
  nameUz: string;
  nameRu?: string;
  shortName?: string;
  universityId: string;
  active: boolean;
}

export interface FacultyDetail {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  universityCode: string;
  universityName: string;
  facultyType?: string;
  facultyTypeName?: string;
  active: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
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

const BASE_URL = '/api/v1/web/registry/faculties';

export const facultiesApi = {
  // Get university groups (root level)
  getGroups: async (params: {
    q?: string;
    status?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<FacultyGroupRow>> => {
    const response = await apiClient.get(`${BASE_URL}/groups`, { params });
    return response.data;
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
    const response = await apiClient.get(
      `${BASE_URL}/by-university/${universityId}`,
      { params }
    );
    return response.data;
  },

  // Get faculty detail
  getFacultyDetail: async (id: string): Promise<FacultyDetail> => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Get dictionaries
  getDictionaries: async (): Promise<FacultyDictionaries> => {
    const response = await apiClient.get(`${BASE_URL}/dictionaries`);
    return response.data;
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
