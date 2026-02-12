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
}

export interface UniversityRow {
  code: string
  name: string
  tin?: string
  address?: string
  region?: string
  regionCode?: string
  ownership?: string
  ownershipCode?: string
  universityType?: string
  universityTypeCode?: string
  soatoRegion?: string
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
  contractCategory?: string
  contractCategoryCode?: string
  activityStatus?: string
  activityStatusCode?: string
  belongsTo?: string
  belongsToCode?: string
  versionTypeCode?: string
  terrain?: string
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
function emptyToUndefined(val: string | undefined | null): string | undefined {
  return val && val.trim() ? val : undefined
}

/**
 * Adapt backend DTO to frontend UniversityRow model
 * Handles both snake_case (CUBA legacy) and camelCase (Spring Boot) field names
 */
function adaptDTO(dto: UniversityBackendDTO): UniversityRow {
  return {
    code: dto.code,
    name: dto.name,
    tin: dto.tin,
    address: dto.address,
    cadastre: dto.cadastre,

    // Classifiers (codes)
    regionCode: dto._soato ?? dto.soato ?? dto._soato_region ?? dto.soatoRegion,
    soatoRegion: dto._soato_region ?? dto.soatoRegion,
    ownershipCode: dto._ownership ?? dto.ownership,
    universityTypeCode: dto._university_type ?? dto.universityType,

    // String fields
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
    versionTypeCode: dto._university_version ?? dto.versionType,
    terrain: dto._terrain ?? dto.terrain,
    mailAddress: dto.mail_address ?? dto.mailAddress,
    bankInfo: dto.bank_info ?? dto.bankInfo,
    accreditationInfo: dto.accreditation_info ?? dto.accreditationInfo,
    contractCategory: dto._university_contract_category ?? dto.contractCategory,
    contractCategoryCode: dto._university_contract_category ?? dto.contractCategory,
    activityStatus: dto._university_activity_status ?? dto.activityStatus,
    activityStatusCode: dto._university_activity_status ?? dto.activityStatus,
    belongsTo: dto._university_belongs_to ?? dto.belongsTo,
    belongsToCode: dto._university_belongs_to ?? dto.belongsTo,
  }
}

export const universitiesApi = {
  async getUniversities(params: UniversitiesParams = {}): Promise<PagedResponse<UniversityRow>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<UniversityBackendDTO>
    }>('/api/v1/web/registry/universities', { params })
    const page = response.data.data

    return {
      ...page,
      content: (page.content ?? []).map(adaptDTO),
    }
  },

  async getUniversity(id: string): Promise<UniversityDetail> {
    const response = await apiClient.get<{ success: boolean; data: UniversityBackendDTO }>(
      `/api/v1/web/registry/universities/${id}`,
    )
    const dto = response.data.data
    return {
      ...adaptDTO(dto),
      parentUniversity: dto._parent_university ?? dto.parentUniversity,
    }
  },

  async exportUniversities(params: Omit<UniversitiesParams, 'page' | 'size' | 'sort'>) {
    // Fetch all matching universities (no pagination)
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<UniversityBackendDTO>
    }>('/api/v1/web/registry/universities', {
      params: { ...params, page: 0, size: 10000 },
    })
    const rows = (response.data.data.content ?? []).map(adaptDTO)
    return rows
  },

  async getDictionaries() {
    const response = await apiClient.get<{ success: boolean; data: Dictionaries }>(
      '/api/v1/web/registry/universities/dictionaries',
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
        tin: emptyToUndefined(data.tin),
        ownership: emptyToUndefined(data.ownershipCode),
        soato: emptyToUndefined(data.regionCode),
        soatoRegion: emptyToUndefined(data.soatoRegion),
        universityType: emptyToUndefined(data.universityTypeCode),
        address: emptyToUndefined(data.address),
        cadastre: emptyToUndefined(data.cadastre),
        universityUrl: emptyToUndefined(data.universityUrl),
        studentUrl: emptyToUndefined(data.studentUrl),
        teacherUrl: emptyToUndefined(data.teacherUrl),
        uzbmbUrl: emptyToUndefined(data.uzbmbUrl),
        mailAddress: emptyToUndefined(data.mailAddress),
        bankInfo: emptyToUndefined(data.bankInfo),
        accreditationInfo: emptyToUndefined(data.accreditationInfo),
        active: data.active ?? true,
        gpaEdit: data.gpaEdit ?? false,
        accreditationEdit: data.accreditationEdit ?? true,
        addStudent: data.addStudent ?? false,
        allowGrouping: data.allowGrouping ?? false,
        allowTransferOutside: data.allowTransferOutside ?? true,
        activityStatus: emptyToUndefined(data.activityStatusCode),
        belongsTo: emptyToUndefined(data.belongsToCode),
        contractCategory: emptyToUndefined(data.contractCategoryCode),
        universityVersion: emptyToUndefined(data.versionTypeCode),
        terrain: emptyToUndefined(data.terrain),
        parentUniversity: emptyToUndefined(data.parentUniversity),
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
        tin: emptyToUndefined(data.tin),
        ownership: emptyToUndefined(data.ownershipCode),
        soato: emptyToUndefined(data.regionCode),
        soatoRegion: emptyToUndefined(data.soatoRegion),
        universityType: emptyToUndefined(data.universityTypeCode),
        address: emptyToUndefined(data.address),
        cadastre: emptyToUndefined(data.cadastre),
        universityUrl: emptyToUndefined(data.universityUrl),
        studentUrl: emptyToUndefined(data.studentUrl),
        teacherUrl: emptyToUndefined(data.teacherUrl),
        uzbmbUrl: emptyToUndefined(data.uzbmbUrl),
        mailAddress: emptyToUndefined(data.mailAddress),
        bankInfo: emptyToUndefined(data.bankInfo),
        accreditationInfo: emptyToUndefined(data.accreditationInfo),
        active: data.active,
        gpaEdit: data.gpaEdit,
        accreditationEdit: data.accreditationEdit,
        addStudent: data.addStudent,
        allowGrouping: data.allowGrouping,
        allowTransferOutside: data.allowTransferOutside,
        activityStatus: emptyToUndefined(data.activityStatusCode),
        belongsTo: emptyToUndefined(data.belongsToCode),
        contractCategory: emptyToUndefined(data.contractCategoryCode),
        universityVersion: emptyToUndefined(data.versionTypeCode),
        terrain: emptyToUndefined(data.terrain),
        parentUniversity: emptyToUndefined(data.parentUniversity),
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
