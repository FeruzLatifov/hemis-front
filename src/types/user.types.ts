export interface UserAdmin {
  id: string
  username: string
  fullName: string | null
  email: string | null
  phone: string | null
  universityCode: string | null
  universityName: string | null
  userType: 'SYSTEM' | 'UNIVERSITY' | 'MINISTRY' | 'ORGANIZATION' | null
  enabled: boolean
  accountNonLocked: boolean
  roles: RoleSummary[]
  createdAt: string
  updatedAt: string | null
}

export interface RoleSummary {
  id: string
  code: string
  name: string
  roleType: 'SYSTEM' | 'UNIVERSITY' | 'CUSTOM'
}

export interface UserCreateRequest {
  username: string
  password: string
  fullName?: string
  email?: string
  phone?: string
  universityCode?: string
  roleIds: string[]
  enabled?: boolean
}

export interface UserUpdateRequest {
  fullName?: string
  email?: string
  phone?: string
  universityCode?: string
  roleIds?: string[]
}

export interface ChangePasswordRequest {
  newPassword: string
  confirmPassword: string
}

export interface UsersParams {
  page?: number
  size?: number
  sort?: string
  search?: string
  role?: string
  university?: string
  enabled?: string
}
