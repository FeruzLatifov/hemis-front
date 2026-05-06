import apiClient from './client'

/**
 * Backend DTO - handles both snake_case and camelCase field names
 * from legacy CUBA and modern Spring Boot endpoints
 */
interface UniversityBackendDTO {
  code: string
  name: string
  tin?: string
  address?: string
  cadastre?: string
  active?: boolean

  // Region/SOATO (multiple naming conventions)
  _soato_region?: string
  soatoRegion?: string
  _soato?: string
  soato?: string
  region?: string

  // Ownership
  _ownership?: string
  ownership?: string

  // University type
  _university_type?: string
  universityType?: string

  // URLs (snake_case and camelCase)
  university_url?: string
  universityUrl?: string
  teacher_url?: string
  teacherUrl?: string
  student_url?: string
  studentUrl?: string
  uzbmb_url?: string
  uzbmbUrl?: string

  // Flags
  gpa_edit?: boolean
  gpaEdit?: boolean
  accreditation_edit?: boolean
  accreditationEdit?: boolean
  add_student?: boolean
  addStudent?: boolean
  allow_grouping?: boolean
  allowGrouping?: boolean
  allow_transfer_outside?: boolean
  allowTransferOutside?: boolean
  one_id?: boolean
  oneId?: boolean
  grading_system?: boolean
  gradingSystem?: boolean
  add_foreign_student?: boolean
  addForeignStudent?: boolean
  add_transfer_student?: boolean
  addTransferStudent?: boolean
  add_academic_mobile_student?: boolean
  addAcademicMobileStudent?: boolean

  // Other fields
  _university_version?: string
  _version_type?: string
  versionType?: string
  _terrain?: string
  terrain?: string
  mail_address?: string
  mailAddress?: string
  bank_info?: string
  bankInfo?: string
  accreditation_info?: string
  accreditationInfo?: string
  _university_contract_category?: string
  contractCategory?: string
  _university_activity_status?: string
  activityStatus?: string
  _university_belongs_to?: string
  belongsTo?: string
  _parent_university?: string
  parentUniversity?: string

  // Resolved display names (populated by backend ClassifierLookupService)
  _ownership_name?: string
  _university_type_name?: string
  _university_activity_status_name?: string
  _university_belongs_to_name?: string
  _university_contract_category_name?: string
  _university_version_name?: string
  _soato_name?: string
  _soato_region_name?: string
  _terrain_name?: string
}

export interface UniversityRow {
  code: string
  name: string
  tin?: string
  address?: string
  /** Backend-resolved name (from ClassifierLookupService); pair of *Code below. */
  region?: string
  regionCode?: string
  ownership?: string
  ownershipCode?: string
  universityType?: string
  universityTypeCode?: string
  /** District code (7-digit SOATO). */
  soatoRegion?: string
  /** District name (resolved by backend). */
  soatoRegionName?: string
  cadastre?: string
  versionType?: string
  universityUrl?: string
  teacherUrl?: string
  studentUrl?: string
  uzbmbUrl?: string
  gpaEdit?: boolean
  accreditationEdit?: boolean
  addStudent?: boolean
  allowGrouping?: boolean
  allowTransferOutside?: boolean
  oneId?: boolean
  gradingSystem?: boolean
  addForeignStudent?: boolean
  addTransferStudent?: boolean
  addAcademicMobileStudent?: boolean
  contractCategory?: string
  contractCategoryCode?: string
  activityStatus?: string
  activityStatusCode?: string
  belongsTo?: string
  belongsToCode?: string
  versionTypeCode?: string
  terrain?: string
  terrainName?: string
  mailAddress?: string
  bankInfo?: string
  accreditationInfo?: string
  active?: boolean
}

export interface UniversityDetail extends UniversityRow {
  parentUniversity?: string
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface UniversitiesParams {
  page?: number
  size?: number
  sort?: string
  q?: string
  searchField?: string
  regionId?: string
  ownershipId?: string
  typeId?: string
  activityStatusId?: string
  belongsToId?: string
  contractCategoryId?: string
  versionTypeId?: string
  districtId?: string
  active?: string
  gpaEdit?: string
  accreditationEdit?: string
  addStudent?: string
  allowGrouping?: string
  allowTransferOutside?: string
  oneId?: string
  gradingSystem?: string
  addForeignStudent?: string
  addTransferStudent?: string
  addAcademicMobileStudent?: string
}

export interface Dictionary {
  code: string
  name: string
}

export interface Dictionaries {
  ownerships: Dictionary[]
  types: Dictionary[]
  regions: Dictionary[]
  activityStatuses: Dictionary[]
  belongsToOptions: Dictionary[]
  contractCategories: Dictionary[]
  versionTypes: Dictionary[]
  districts: Dictionary[]
}

/** Convert empty/whitespace-only strings to undefined so backend receives NULL instead of "" */
function emptyToNull(val: string | undefined | null): string | null {
  return val && val.trim() ? val : null
}

/**
 * Adapt backend DTO to frontend UniversityRow model
 * Handles both snake_case (CUBA legacy) and camelCase (Spring Boot) field names
 */
function adaptDTO(dto: UniversityBackendDTO): UniversityRow {
  // CUBA legacy: `_soato` = 4-digit REGION code, `_soato_region` = 7-digit DISTRICT code.
  // Backend ClassifierLookupService populates `*_name` fields with resolved display names
  // — frontend just renders them, no per-row dictionary lookup needed.
  return {
    code: dto.code,
    name: dto.name,
    tin: dto.tin,
    address: dto.address,
    cadastre: dto.cadastre,

    // Codes (used by Form selects and filters)
    regionCode: dto._soato ?? dto.soato,
    soatoRegion: dto._soato_region ?? dto.soatoRegion,
    ownershipCode: dto._ownership ?? dto.ownership,
    universityTypeCode: dto._university_type ?? dto.universityType,

    // Display names (resolved by backend) — fall back to raw code if backend didn't resolve.
    region: dto._soato_name ?? dto.region,
    soatoRegionName: dto._soato_region_name,
    ownership: dto._ownership_name ?? dto.ownership,
    universityType: dto._university_type_name ?? dto.universityType,

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
    oneId: dto.one_id ?? dto.oneId,
    gradingSystem: dto.grading_system ?? dto.gradingSystem,
    addForeignStudent: dto.add_foreign_student ?? dto.addForeignStudent,
    addTransferStudent: dto.add_transfer_student ?? dto.addTransferStudent,
    addAcademicMobileStudent: dto.add_academic_mobile_student ?? dto.addAcademicMobileStudent,
    active: dto.active,

    // Other fields — codes paired with backend-resolved names
    versionType: dto._university_version_name ?? dto._version_type ?? dto.versionType,
    versionTypeCode: dto._university_version,
    terrain: dto._terrain ?? dto.terrain,
    terrainName: dto._terrain_name,
    mailAddress: dto.mail_address ?? dto.mailAddress,
    bankInfo: dto.bank_info ?? dto.bankInfo,
    accreditationInfo: dto.accreditation_info ?? dto.accreditationInfo,
    contractCategory:
      dto._university_contract_category_name ??
      dto._university_contract_category ??
      dto.contractCategory,
    contractCategoryCode: dto._university_contract_category ?? dto.contractCategory,
    activityStatus:
      dto._university_activity_status_name ?? dto._university_activity_status ?? dto.activityStatus,
    activityStatusCode: dto._university_activity_status ?? dto.activityStatus,
    belongsTo: dto._university_belongs_to_name ?? dto._university_belongs_to ?? dto.belongsTo,
    belongsToCode: dto._university_belongs_to ?? dto.belongsTo,
  }
}

export const universitiesApi = {
  async getUniversities(
    params: UniversitiesParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<UniversityRow>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<UniversityBackendDTO>
    }>('/api/v1/web/registry/universities', { params, signal })
    const page = response.data.data

    return {
      ...page,
      content: (page.content ?? []).map(adaptDTO),
    }
  },

  async getUniversity(id: string, signal?: AbortSignal): Promise<UniversityDetail> {
    const response = await apiClient.get<{ success: boolean; data: UniversityBackendDTO }>(
      `/api/v1/web/registry/universities/${id}`,
      { signal },
    )
    const dto = response.data.data
    return {
      ...adaptDTO(dto),
      parentUniversity: dto._parent_university ?? dto.parentUniversity,
    }
  },

  async exportUniversities(params: Omit<UniversitiesParams, 'page' | 'size' | 'sort'>) {
    // Server-side CSV export. Backend produces UTF-8 BOM CSV that Excel
    // opens natively, eliminating the need for the (CVE-laden) `xlsx`
    // package on the client.
    const response = await apiClient.post<Blob>('/api/v1/web/registry/universities/export', null, {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  async getDictionaries(signal?: AbortSignal) {
    const response = await apiClient.get<{ success: boolean; data: Dictionaries }>(
      '/api/v1/web/registry/universities/dictionaries',
      { signal },
    )
    return response.data.data
  },

  async getTerrains(soato: string, signal?: AbortSignal): Promise<Dictionary[]> {
    const response = await apiClient.get<{ success: boolean; data: Dictionary[] }>(
      '/api/v1/web/registry/universities/terrains',
      { params: { soato }, signal },
    )
    return response.data.data
  },

  /**
   * Create new university
   */
  async createUniversity(data: Partial<UniversityDetail>): Promise<UniversityRow> {
    const response = await apiClient.post<{ success: boolean; data: UniversityBackendDTO }>(
      '/api/v1/web/registry/universities',
      {
        code: data.code,
        name: data.name,
        tin: emptyToNull(data.tin),
        ownership: emptyToNull(data.ownershipCode),
        // Backend semantics: `soato` column = 4-digit region; `soatoRegion` column = 7-digit district.
        soato: emptyToNull(data.regionCode),
        soatoRegion: emptyToNull(data.soatoRegion),
        universityType: emptyToNull(data.universityTypeCode),
        address: emptyToNull(data.address),
        cadastre: emptyToNull(data.cadastre),
        universityUrl: emptyToNull(data.universityUrl),
        studentUrl: emptyToNull(data.studentUrl),
        teacherUrl: emptyToNull(data.teacherUrl),
        uzbmbUrl: emptyToNull(data.uzbmbUrl),
        mailAddress: emptyToNull(data.mailAddress),
        bankInfo: emptyToNull(data.bankInfo),
        accreditationInfo: emptyToNull(data.accreditationInfo),
        active: data.active ?? true,
        gpaEdit: data.gpaEdit ?? false,
        accreditationEdit: data.accreditationEdit ?? true,
        addStudent: data.addStudent ?? false,
        allowGrouping: data.allowGrouping ?? false,
        allowTransferOutside: data.allowTransferOutside ?? true,
        oneId: data.oneId ?? false,
        gradingSystem: data.gradingSystem ?? false,
        addForeignStudent: data.addForeignStudent ?? false,
        addTransferStudent: data.addTransferStudent ?? false,
        addAcademicMobileStudent: data.addAcademicMobileStudent ?? false,
        activityStatus: emptyToNull(data.activityStatusCode),
        belongsTo: emptyToNull(data.belongsToCode),
        contractCategory: emptyToNull(data.contractCategoryCode),
        universityVersion: emptyToNull(data.versionTypeCode),
        terrain: emptyToNull(data.terrain),
        parentUniversity: emptyToNull(data.parentUniversity),
      },
    )
    return adaptDTO(response.data.data)
  },

  /**
   * Update existing university
   */
  async updateUniversity(code: string, data: Partial<UniversityDetail>): Promise<UniversityRow> {
    const response = await apiClient.put<{ success: boolean; data: UniversityBackendDTO }>(
      `/api/v1/web/registry/universities/${code}`,
      {
        code: data.code,
        name: data.name,
        tin: emptyToNull(data.tin),
        ownership: emptyToNull(data.ownershipCode),
        // Backend semantics: `soato` column = 4-digit region; `soatoRegion` column = 7-digit district.
        soato: emptyToNull(data.regionCode),
        soatoRegion: emptyToNull(data.soatoRegion),
        universityType: emptyToNull(data.universityTypeCode),
        address: emptyToNull(data.address),
        cadastre: emptyToNull(data.cadastre),
        universityUrl: emptyToNull(data.universityUrl),
        studentUrl: emptyToNull(data.studentUrl),
        teacherUrl: emptyToNull(data.teacherUrl),
        uzbmbUrl: emptyToNull(data.uzbmbUrl),
        mailAddress: emptyToNull(data.mailAddress),
        bankInfo: emptyToNull(data.bankInfo),
        accreditationInfo: emptyToNull(data.accreditationInfo),
        active: data.active,
        gpaEdit: data.gpaEdit,
        accreditationEdit: data.accreditationEdit,
        addStudent: data.addStudent,
        allowGrouping: data.allowGrouping,
        allowTransferOutside: data.allowTransferOutside,
        oneId: data.oneId,
        gradingSystem: data.gradingSystem,
        addForeignStudent: data.addForeignStudent,
        addTransferStudent: data.addTransferStudent,
        addAcademicMobileStudent: data.addAcademicMobileStudent,
        activityStatus: emptyToNull(data.activityStatusCode),
        belongsTo: emptyToNull(data.belongsToCode),
        contractCategory: emptyToNull(data.contractCategoryCode),
        universityVersion: emptyToNull(data.versionTypeCode),
        terrain: emptyToNull(data.terrain),
        parentUniversity: emptyToNull(data.parentUniversity),
      },
    )
    return adaptDTO(response.data.data)
  },

  /**
   * Delete university (soft delete)
   */
  async deleteUniversity(code: string): Promise<void> {
    await apiClient.delete(`/api/v1/web/registry/universities/${code}`)
  },
}
