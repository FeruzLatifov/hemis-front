// User Types
export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'ministry' | 'university' | 'teacher' | 'student'
  firstName: string
  lastName: string
  avatar?: string
}

// University Types
export interface University {
  id: string
  code: string
  name: string
  region: string
  ownership: string
  type: string
  studentCount: number
  teacherCount: number
  active: boolean
}

// Student Types
export interface Student {
  id: string
  code: string
  pinfl: string
  firstName: string
  lastName: string
  fatherName: string
  birthday: string
  gender: 'male' | 'female'
  university: University
  faculty: string
  specialty: string
  course: number
  educationType: 'bachelor' | 'master' | 'phd'
  paymentForm: 'grant' | 'contract'
  active: boolean
}

// Teacher Types
export interface Teacher {
  id: string
  code: string
  pinfl: string
  firstName: string
  lastName: string
  fatherName: string
  birthday: string
  gender: 'male' | 'female'
  university: University
  department: string
  position: string
  academicDegree?: string
  academicRank?: string
  active: boolean
}

// Common Types
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: T[keyof T] | undefined, row: T) => React.ReactNode
}

export interface FilterOption {
  label: string
  value: string | number
}
