export type AccountType = 'PERSON' | 'UNIVERSITY_LOGIN'

export interface UserAdmin {
  id: string
  username: string
  fullName: string | null
  firstName?: string | null
  lastName?: string | null
  middleName?: string | null
  email: string | null
  phone: string | null
  pinfl?: string | null
  passport?: string | null
  birthDate?: string | null
  birthPlace?: string | null
  gender?: string | null
  nationality?: string | null
  address?: string | null
  universityCode: string | null
  universityName: string | null
  userType: 'SYSTEM' | 'UNIVERSITY' | 'MINISTRY' | 'ORGANIZATION' | null
  enabled: boolean
  accountNonLocked: boolean
  roles: RoleSummary[]
  createdAt: string
  updatedAt: string | null
}

/** Person data resolved from the GUVD/api_mspd passport-data gateway (autofill). */
export interface GovPerson {
  pinfl?: string | null
  firstName?: string | null
  lastName?: string | null
  middleName?: string | null
  fullName?: string | null
  birthDate?: string | null
  birthPlace?: string | null
  gender?: string | null
  nationality?: string | null
  passport?: string | null
  passportGivePlace?: string | null
  passportIssuedDate?: string | null
  passportExpiryDate?: string | null
  address?: string | null
  photo?: string | null
}

export interface RoleSummary {
  id: string
  code: string
  name: string
  roleType: 'SYSTEM' | 'UNIVERSITY' | 'CUSTOM'
}

export interface UserCreateRequest {
  accountType?: AccountType
  username: string
  password: string
  fullName?: string
  email?: string
  phone?: string
  universityCode?: string
  roleIds: string[]
  enabled?: boolean
  // PERSON account fields (PINFL + GUVD passport-data autofill)
  pinfl?: string
  firstName?: string
  lastName?: string
  middleName?: string
  birthDate?: string
  birthPlace?: string
  passport?: string
  passportGivePlace?: string
  passportIssuedDate?: string
  passportExpiryDate?: string
  gender?: string
  nationality?: string
  address?: string
  photo?: string
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
