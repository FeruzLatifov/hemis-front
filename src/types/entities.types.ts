/**
 * University Entity Types
 */

export interface University {
  id: number
  code: string
  name: string
  shortName: string
  tin?: string
  address?: string
  region?: string
  regionCode?: string
  ownership?: string
  ownershipCode?: string
  universityType?: string
  universityTypeCode?: string
  rectorName?: string
  rectorPhone?: string
  email?: string
  website?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface UniversityFormData {
  code: string
  name: string
  shortName: string
  tin?: string
  address?: string
  regionCode?: string
  ownershipCode?: string
  universityTypeCode?: string
  rectorName?: string
  rectorPhone?: string
  email?: string
  website?: string
  active: boolean
}

export interface Faculty {
  id: number
  universityId: number
  universityCode: string
  code: string
  name: string
  shortName?: string
  deanName?: string
  deanPhone?: string
  email?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface FacultyFormData {
  universityId: number
  code: string
  name: string
  shortName?: string
  deanName?: string
  deanPhone?: string
  email?: string
  active: boolean
}

export interface Student {
  id: number
  studentId: string
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE'
  universityCode: string
  universityName: string
  facultyCode: string
  facultyName: string
  specialtyCode: string
  specialtyName: string
  educationForm: string
  educationLanguage: string
  course: number
  status: 'ACTIVE' | 'GRADUATED' | 'EXPELLED' | 'ACADEMIC_LEAVE' | 'CANCELLED'
  paymentType: 'GRANT' | 'CONTRACT'
  createdAt: string
  updatedAt: string
}

export interface Teacher {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  middleName?: string
  position: string
  degree?: string
  academicRank?: string
  universityCode: string
  universityName: string
  facultyCode?: string
  facultyName?: string
  email?: string
  phone?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Translation {
  id: number
  code: string
  categoryCode: string
  categoryName: string
  uz: string
  ru: string
  en: string
  description?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface TranslationFormData {
  code: string
  categoryCode: string
  uz: string
  ru: string
  en: string
  description?: string
  active: boolean
}
