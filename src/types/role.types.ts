/**
 * Role Code Enum - Type-Safe Role Identifiers
 *
 * Synced with Backend: uz.hemis.common.enums.RoleCode
 */

export enum RoleCode {
  // System Roles (SYSTEM)
  SUPER_ADMIN = 'SUPER_ADMIN',
  MINISTRY_ADMIN = 'MINISTRY_ADMIN',
  VIEWER = 'VIEWER',

  // University Roles (UNIVERSITY)
  UNIVERSITY_ADMIN = 'UNIVERSITY_ADMIN',

  // Custom Roles (CUSTOM)
  REPORT_VIEWER = 'REPORT_VIEWER',
}

// ── Role CRUD Types ──

export interface RoleAdmin {
  id: string
  code: string
  name: string
  description: string | null
  roleType: 'SYSTEM' | 'UNIVERSITY' | 'CUSTOM'
  active: boolean
  permissions: PermissionItem[]
  usersCount: number
  createdAt: string
  updatedAt: string | null
}

export interface PermissionItem {
  id: string
  code: string
  name: string
  category: string | null
  resource: string
  action: string
}

export interface RoleCreateRequest {
  code: string
  name: string
  description?: string
  permissionIds?: string[]
}

export interface RoleUpdateRequest {
  name?: string
  description?: string
  permissionIds?: string[]
}

export interface RolesParams {
  page?: number
  size?: number
  sort?: string
  search?: string
}
