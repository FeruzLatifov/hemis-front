import apiClient from './client'
import type { PagedResponse } from './classifiers.api'

// =====================================================
// Types
// =====================================================

/**
 * Backend StudentListDto JSON structure (lightweight, 18 fields).
 * Used by GET /api/v1/web/students (list endpoint).
 */
interface StudentListBackendDTO {
  id: string
  code: string
  firstname: string
  lastname: string
  fathername: string
  fullname: string
  pinfl: string
  _university: string | null
  _faculty: string | null
  _speciality: string | null
  _student_status: string | null
  _payment_form: string | null
  _education_type: string | null
  _education_form: string | null
  _course: string | null
  _education_year: string | null
  _gender: string | null
  groupName: string | null
  active: boolean | null
}

/**
 * Backend StudentDto JSON structure (full, 50+ fields).
 * Used by GET /api/v1/web/students/:id and /by-code/:code.
 */
interface StudentFullBackendDTO extends StudentListBackendDTO {
  birthday: string | null
  serialNumber: string | null
  phone: string | null
  email: string | null
  address: string | null
  _nationality: string | null
  _citizenship: string | null
  groupId: string | null
  isDuplicate: boolean | null
  tag: string | null
}

export interface StudentRow {
  id: string
  code: string
  fullName: string
  firstname: string
  lastname: string
  fathername: string
  pinfl: string
  university: string
  faculty: string
  speciality: string
  studentStatus: string
  paymentForm: string
  educationType: string
  educationForm: string
  course: string
  educationYear: string
  gender: string
  groupName: string
  active: boolean
}

/** Full student detail (includes fields not available in list view) */
export interface StudentDetail extends StudentRow {
  birthday: string | null
  phone: string | null
  email: string | null
}

export interface StudentStats {
  total: number
  grantCount: number
  contractCount: number
  graduateCount: number
}

export interface StudentDictionary {
  code: string
  name: string
}

export interface StudentDictionaries {
  courses: StudentDictionary[]
  studentStatuses: StudentDictionary[]
  paymentForms: StudentDictionary[]
  educationTypes: StudentDictionary[]
  educationForms: StudentDictionary[]
  genders: StudentDictionary[]
}

export interface StudentsParams {
  page?: number
  size?: number
  sort?: string
  q?: string
  searchField?: 'code' | 'pinfl'
  university?: string
  educationType?: string
  paymentForm?: string
  studentStatus?: string
  course?: string
  faculty?: string
  educationForm?: string
  educationYear?: string
  gender?: string
}

// =====================================================
// Duplicate Detection Types
// =====================================================

export type DuplicateReason =
  | 'NORMAL'
  | 'CROSS_UNIVERSITY'
  | 'SAME_UNIVERSITY'
  | 'MULTI_LEVEL'
  | 'INTERNAL_TRANSFER'
  | 'EXTERNAL_TRANSFER'

export interface DuplicateStats {
  totalDuplicatePinfls: number
  totalAffectedStudents: number
  normalCount: number
  crossUniversityCount: number
  sameUniversityCount: number
  multiLevelCount: number
  internalTransferCount: number
  externalTransferCount: number
  maxDuplicateCount: number
}

export interface DuplicateGroup {
  pinfl: string
  count: number
  universityCount: number
  activeCount: number
  reason: DuplicateReason
  representativeName: string
}

export interface DuplicateStudentCard {
  id: string
  code: string
  fullName: string
  universityCode: string
  universityName: string
  studentStatusCode: string
  studentStatusName: string
  active: boolean
  educationTypeCode: string
  educationTypeName: string
  educationFormCode: string
  educationFormName: string
  paymentFormCode: string
  paymentFormName: string
  courseCode: string
  courseName: string
  groupName: string
  educationYear: string
  specialityName: string | null
}

export interface DuplicateGroupDetail {
  pinfl: string
  fullName: string
  count: number
  universityCount: number
  activeCount: number
  reason: DuplicateReason
  reasonDescription: string
  recommendation: string
  students: DuplicateStudentCard[]
}

export interface DuplicatesParams {
  page?: number
  size?: number
  university?: string
  reason?: DuplicateReason | ''
}

// =====================================================
// Speciality Directions Types
// =====================================================

export interface SpecialityStats {
  id: string
  code: string
  name: string
  educationType: string // BACHELOR | MASTER | ORDINATURA
  totalStudents: number
  activeStudents: number
  graduatedStudents: number
  expelledStudents: number
}

export interface SpecialitySummary {
  totalSpecialities: number
  withStudents: number
  withoutStudents: number
  totalStudentsInSpecialities: number
}

export interface DirectionsParams {
  page?: number
  size?: number
  search?: string
  educationType?: string
  hasStudents?: boolean
}

/** Backend DuplicateGroupDto JSON structure (lightweight — no students) */
interface DuplicateGroupBackendDTO {
  pinfl: string
  count: number
  universityCount: number
  activeCount: number
  reason: DuplicateReason
  representativeName: string
}

// =====================================================
// Adapter: backend underscore → frontend camelCase
// =====================================================

function adaptStudentListDTO(dto: StudentListBackendDTO): StudentRow {
  return {
    id: dto.id,
    code: dto.code || '',
    fullName:
      dto.fullname || [dto.lastname, dto.firstname, dto.fathername].filter(Boolean).join(' '),
    firstname: dto.firstname || '',
    lastname: dto.lastname || '',
    fathername: dto.fathername || '',
    pinfl: dto.pinfl || '',
    university: dto._university || '',
    faculty: dto._faculty || '',
    speciality: dto._speciality || '',
    studentStatus: dto._student_status || '',
    paymentForm: dto._payment_form || '',
    educationType: dto._education_type || '',
    educationForm: dto._education_form || '',
    course: dto._course || '',
    educationYear: dto._education_year || '',
    gender: dto._gender || '',
    groupName: dto.groupName || '',
    active: dto.active ?? true,
  }
}

function adaptStudentFullDTO(dto: StudentFullBackendDTO): StudentDetail {
  return {
    ...adaptStudentListDTO(dto),
    birthday: dto.birthday,
    phone: dto.phone,
    email: dto.email,
  }
}

function adaptDuplicateGroup(dto: DuplicateGroupBackendDTO): DuplicateGroup {
  return {
    pinfl: dto.pinfl,
    count: dto.count,
    universityCount: dto.universityCount,
    activeCount: dto.activeCount,
    reason: dto.reason,
    representativeName: dto.representativeName,
  }
}

// =====================================================
// API
// =====================================================

export const studentsApi = {
  async getStudents(
    params: StudentsParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<StudentRow>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<StudentListBackendDTO>
    }>('/api/v1/web/students', { params, signal })

    const backendPage = response.data.data
    return {
      ...backendPage,
      content: backendPage.content.map(adaptStudentListDTO),
    }
  },

  async getStudent(id: string, signal?: AbortSignal): Promise<StudentDetail> {
    const response = await apiClient.get<{
      success: boolean
      data: StudentFullBackendDTO
    }>(`/api/v1/web/students/${id}`, { signal })
    return adaptStudentFullDTO(response.data.data)
  },

  async getStudentByCode(code: string, signal?: AbortSignal): Promise<StudentDetail> {
    const response = await apiClient.get<{
      success: boolean
      data: StudentFullBackendDTO
    }>(`/api/v1/web/students/by-code/${code}`, { signal })
    return adaptStudentFullDTO(response.data.data)
  },

  async getStats(university?: string, signal?: AbortSignal): Promise<StudentStats> {
    const params = university ? { university } : {}
    const response = await apiClient.get<{
      success: boolean
      data: StudentStats
    }>('/api/v1/web/students/stats', { params, signal })
    return response.data.data
  },

  async getDictionaries(signal?: AbortSignal): Promise<StudentDictionaries> {
    const response = await apiClient.get<{
      success: boolean
      data: StudentDictionaries
    }>('/api/v1/web/students/dictionaries', { signal })
    return response.data.data
  },

  // =====================================================
  // Duplicate Detection API
  // =====================================================

  async getDuplicateStats(university?: string, signal?: AbortSignal): Promise<DuplicateStats> {
    const params = university ? { university } : {}
    const response = await apiClient.get<{
      success: boolean
      data: DuplicateStats
    }>('/api/v1/web/students/duplicates/stats', { params, signal })
    return response.data.data
  },

  async getDuplicates(
    params: DuplicatesParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<DuplicateGroup>> {
    const queryParams: Record<string, string | number> = {}
    if (params.page !== undefined) queryParams.page = params.page
    if (params.size !== undefined) queryParams.size = params.size
    if (params.university) queryParams.university = params.university
    if (params.reason) queryParams.reason = params.reason

    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<DuplicateGroupBackendDTO>
    }>('/api/v1/web/students/duplicates', { params: queryParams, signal })

    const backendPage = response.data.data
    return {
      ...backendPage,
      content: backendPage.content.map(adaptDuplicateGroup),
    }
  },

  async getDuplicateGroupDetail(
    pinfl: string,
    signal?: AbortSignal,
  ): Promise<DuplicateGroupDetail> {
    const response = await apiClient.get<{
      success: boolean
      data: DuplicateGroupDetail
    }>(`/api/v1/web/students/duplicates/groups/${pinfl}`, { signal })
    return response.data.data
  },

  // =====================================================
  // Speciality Directions API
  // =====================================================

  async getDirections(
    params: DirectionsParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<SpecialityStats>> {
    const queryParams: Record<string, string | number | boolean> = {}
    if (params.page !== undefined) queryParams.page = params.page
    if (params.size !== undefined) queryParams.size = params.size
    if (params.search) queryParams.search = params.search
    if (params.educationType) queryParams.educationType = params.educationType
    if (params.hasStudents !== undefined) queryParams.hasStudents = params.hasStudents

    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<SpecialityStats>
    }>('/api/v1/web/students/directions', { params: queryParams, signal })
    return response.data.data
  },

  async getDirectionsSummary(signal?: AbortSignal): Promise<SpecialitySummary> {
    const response = await apiClient.get<{
      success: boolean
      data: SpecialitySummary
    }>('/api/v1/web/students/directions/summary', { signal })
    return response.data.data
  },
}
