/**
 * Form Validation Types
 */

import type { UniversityFormData, FacultyFormData, TranslationFormData } from './entities.types'
import type { LoginRequest } from './auth.types'

export type { UniversityFormData, FacultyFormData, TranslationFormData, LoginRequest }

export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T> {
  data: T
  errors: Record<keyof T, string>
  isSubmitting: boolean
  isValid: boolean
}

export interface FilterFormData {
  q?: string
  regionCode?: string
  ownershipCode?: string
  typeCode?: string
  active?: boolean
  page?: number
  size?: number
}

export interface StudentFilterFormData extends FilterFormData {
  universityCode?: string
  facultyCode?: string
  status?: string
  paymentType?: string
  course?: number
  educationForm?: string
  gender?: 'MALE' | 'FEMALE'
}

export interface TeacherFilterFormData extends FilterFormData {
  universityCode?: string
  facultyCode?: string
  position?: string
  degree?: string
}
