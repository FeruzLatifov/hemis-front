import apiClient from './client';

export interface UniversityRow {
  code: string;
  name: string;
  tin?: string;
  address?: string;
  region?: string;
  regionCode?: string;
  ownership?: string;
  ownershipCode?: string;
  universityType?: string;
  universityTypeCode?: string;
  soatoRegion?: string;
  cadastre?: string;
  versionType?: string;
  universityUrl?: string;
  teacherUrl?: string;
  studentUrl?: string;
  uzbmbUrl?: string;
  gpaEdit?: boolean;
  accreditationEdit?: boolean;
  addStudent?: boolean;
  allowGrouping?: boolean;
  allowTransferOutside?: boolean;
  contractCategory?: string;
  activityStatus?: string;
  belongsTo?: string;
  terrain?: string;
  mailAddress?: string;
  bankInfo?: string;
  accreditationInfo?: string;
  active?: boolean;
}

export interface UniversityDetail extends UniversityRow {
  parentUniversity?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UniversitiesParams {
  page?: number;
  size?: number;
  sort?: string;
  q?: string;
  regionId?: string;
  ownershipId?: string;
  typeId?: string;
}

export interface Dictionary {
  code: string;
  name: string;
}

export interface Dictionaries {
  ownerships: Dictionary[];
  types: Dictionary[];
  regions: Dictionary[];
}

export const universitiesApi = {
  async getUniversities(params: UniversitiesParams = {}) {
    const response = await apiClient.get<{ success: boolean; data: PagedResponse<UniversityRow> }>(
      '/api/v1/web/registry/universities',
      { params }
    );
    return response.data.data;
  },

  async getUniversity(id: string) {
    const response = await apiClient.get<{ success: boolean; data: UniversityDetail }>(
      `/api/v1/web/registry/universities/${id}`
    );
    return response.data.data;
  },

  async exportUniversities(params: Omit<UniversitiesParams, 'page' | 'size' | 'sort'>) {
    const response = await apiClient.post(
      '/api/v1/web/registry/universities/export',
      null,
      {
        params,
        responseType: 'blob',
      }
    );
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'universities.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getDictionaries() {
    const response = await apiClient.get<{ success: boolean; data: Dictionaries }>(
      '/api/v1/web/registry/universities/dictionaries'
    );
    return response.data.data;
  },
};

