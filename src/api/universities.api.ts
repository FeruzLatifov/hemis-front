import apiClient from './client';

/**
 * Backend DTO - handles both snake_case and camelCase field names
 * from legacy CUBA and modern Spring Boot endpoints
 */
interface UniversityBackendDTO {
  code: string;
  name: string;
  tin?: string;
  address?: string;
  cadastre?: string;
  active?: boolean;

  // Region/SOATO (multiple naming conventions)
  _soato_region?: string;
  soatoRegion?: string;
  _soato?: string;
  soato?: string;
  region?: string;

  // Ownership
  _ownership?: string;
  ownership?: string;

  // University type
  _university_type?: string;
  universityType?: string;

  // URLs (snake_case and camelCase)
  university_url?: string;
  universityUrl?: string;
  teacher_url?: string;
  teacherUrl?: string;
  student_url?: string;
  studentUrl?: string;
  uzbmb_url?: string;
  uzbmbUrl?: string;

  // Flags
  gpa_edit?: boolean;
  gpaEdit?: boolean;
  accreditation_edit?: boolean;
  accreditationEdit?: boolean;
  add_student?: boolean;
  addStudent?: boolean;
  allow_grouping?: boolean;
  allowGrouping?: boolean;
  allow_transfer_outside?: boolean;
  allowTransferOutside?: boolean;

  // Other fields
  _version_type?: string;
  versionType?: string;
  _terrain?: string;
  terrain?: string;
  mail_address?: string;
  mailAddress?: string;
  bank_info?: string;
  bankInfo?: string;
  accreditation_info?: string;
  accreditationInfo?: string;
  _university_contract_category?: string;
  contractCategory?: string;
  _university_activity_status?: string;
  activityStatus?: string;
  _university_belongs_to?: string;
  belongsTo?: string;
  _parent_university?: string;
  parentUniversity?: string;
}

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
  async getUniversities(params: UniversitiesParams = {}): Promise<PagedResponse<UniversityRow>> {
    const response = await apiClient.get<{ success: boolean; data: PagedResponse<UniversityBackendDTO> }>(
      '/api/v1/web/registry/universities',
      { params }
    );
    const page = response.data.data;

    const adapt = (dto: UniversityBackendDTO): UniversityRow => ({
      code: dto.code,
      name: dto.name,
      tin: dto.tin,
      address: dto.address,
      cadastre: dto.cadastre,

      // Classifiers (codes)
      regionCode: dto._soato_region ?? dto.soatoRegion ?? dto._soato ?? dto.soato,
      soatoRegion: dto._soato_region ?? dto.soatoRegion,
      ownershipCode: dto._ownership ?? dto.ownership,
      universityTypeCode: dto._university_type ?? dto.universityType,

      // Also expose string fields (will be resolved to names in UI if dictionaries available)
      region: dto.region ?? dto.soatoRegion ?? dto._soato_region,
      ownership: dto.ownership ?? dto._ownership,
      universityType: dto.universityType ?? dto._university_type,

      // URLs
      universityUrl: dto.university_url ?? dto.universityUrl,
      teacherUrl: dto.teacher_url ?? dto.teacherUrl,
      studentUrl: dto.student_url ?? dto.studentUrl,
      uzbmbUrl: dto.uzbmb_url ?? dto.uzbmbUrl,

      // Flags
      gpaEdit: dto.gpa_edit ?? dto.gpaEdit,
      accreditationEdit: dto.accreditation_edit ?? dto.accreditationEdit,
      addStudent: dto.add_student ?? dto.addStudent,
      allowGrouping: dto.allow_grouping ?? dto.allowGrouping,
      allowTransferOutside: dto.allow_transfer_outside ?? dto.allowTransferOutside,
      active: dto.active,

      // Other fields
      versionType: dto._version_type ?? dto.versionType,
      terrain: dto._terrain ?? dto.terrain,
      mailAddress: dto.mail_address ?? dto.mailAddress,
      bankInfo: dto.bank_info ?? dto.bankInfo,
      accreditationInfo: dto.accreditation_info ?? dto.accreditationInfo,
      contractCategory: dto._university_contract_category ?? dto.contractCategory,
      activityStatus: dto._university_activity_status ?? dto.activityStatus,
      belongsTo: dto._university_belongs_to ?? dto.belongsTo,
    });

    return {
      ...page,
      content: (page.content ?? []).map(adapt),
    };
  },

  async getUniversity(id: string): Promise<UniversityDetail> {
    const response = await apiClient.get<{ success: boolean; data: UniversityBackendDTO }>(
      `/api/v1/web/registry/universities/${id}`
    );
    const dto = response.data.data;
    const adapted: UniversityDetail = {
      code: dto.code,
      name: dto.name,
      tin: dto.tin,
      address: dto.address,
      cadastre: dto.cadastre,

      regionCode: dto._soato_region ?? dto.soatoRegion ?? dto._soato ?? dto.soato,
      soatoRegion: dto._soato_region ?? dto.soatoRegion,
      ownershipCode: dto._ownership ?? dto.ownership,
      universityTypeCode: dto._university_type ?? dto.universityType,

      region: dto.region ?? dto.soatoRegion ?? dto._soato_region,
      ownership: dto.ownership ?? dto._ownership,
      universityType: dto.universityType ?? dto._university_type,

      universityUrl: dto.university_url ?? dto.universityUrl,
      teacherUrl: dto.teacher_url ?? dto.teacherUrl,
      studentUrl: dto.student_url ?? dto.studentUrl,
      uzbmbUrl: dto.uzbmb_url ?? dto.uzbmbUrl,

      gpaEdit: dto.gpa_edit ?? dto.gpaEdit,
      accreditationEdit: dto.accreditation_edit ?? dto.accreditationEdit,
      addStudent: dto.add_student ?? dto.addStudent,
      allowGrouping: dto.allow_grouping ?? dto.allowGrouping,
      allowTransferOutside: dto.allow_transfer_outside ?? dto.allowTransferOutside,
      active: dto.active,

      versionType: dto._version_type ?? dto.versionType,
      terrain: dto._terrain ?? dto.terrain,
      mailAddress: dto.mail_address ?? dto.mailAddress,
      bankInfo: dto.bank_info ?? dto.bankInfo,
      accreditationInfo: dto.accreditation_info ?? dto.accreditationInfo,
      contractCategory: dto._university_contract_category ?? dto.contractCategory,
      activityStatus: dto._university_activity_status ?? dto.activityStatus,
      belongsTo: dto._university_belongs_to ?? dto.belongsTo,

      parentUniversity: dto._parent_university ?? dto.parentUniversity,
    };
    return adapted;
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
  
  /**
   * Create new university
   */
  async createUniversity(data: Partial<UniversityRow>): Promise<UniversityRow> {
    const response = await apiClient.post<{ success: boolean; data: UniversityBackendDTO }>(
      '/api/v1/web/registry/universities',
      {
        code: data.code,
        name: data.name,
        tin: data.tin,
        ownership: data.ownershipCode,
        soato: data.regionCode,
        soatoRegion: data.soatoRegion,
        universityType: data.universityTypeCode,
        address: data.address,
        cadastre: data.cadastre,
        universityUrl: data.universityUrl,
        studentUrl: data.studentUrl,
        teacherUrl: data.teacherUrl,
        uzbmbUrl: data.uzbmbUrl,
        active: data.active ?? true,
        gpaEdit: data.gpaEdit ?? false,
        accreditationEdit: data.accreditationEdit ?? true,
        addStudent: data.addStudent ?? false,
        allowGrouping: data.allowGrouping ?? false,
        allowTransferOutside: data.allowTransferOutside ?? true,
      }
    );
    return response.data.data;
  },

  /**
   * Update existing university
   */
  async updateUniversity(code: string, data: Partial<UniversityRow>): Promise<UniversityRow> {
    const response = await apiClient.put<{ success: boolean; data: UniversityBackendDTO }>(
      `/api/v1/web/registry/universities/${code}`,
      {
        code: data.code,
        name: data.name,
        tin: data.tin,
        ownership: data.ownershipCode,
        soato: data.regionCode,
        soatoRegion: data.soatoRegion,
        universityType: data.universityTypeCode,
        address: data.address,
        cadastre: data.cadastre,
        universityUrl: data.universityUrl,
        studentUrl: data.studentUrl,
        teacherUrl: data.teacherUrl,
        uzbmbUrl: data.uzbmbUrl,
        active: data.active,
        gpaEdit: data.gpaEdit,
        accreditationEdit: data.accreditationEdit,
        addStudent: data.addStudent,
        allowGrouping: data.allowGrouping,
        allowTransferOutside: data.allowTransferOutside,
      }
    );
    return response.data.data;
  },

  /**
   * Delete university (soft delete)
   */
  async deleteUniversity(code: string): Promise<void> {
    await apiClient.delete(`/api/v1/web/registry/universities/${code}`);
  },
};

