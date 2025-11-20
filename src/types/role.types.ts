/**
 * Role Code Enum - Type-Safe Role Identifiers
 *
 * ✅ Synced with Backend: uz.hemis.common.enums.RoleCode
 *
 * Purpose:
 * - Type-safe role codes (no magic strings)
 * - Central definition for all roles
 * - IDE autocomplete support
 * - Matches backend enum exactly
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

export enum RoleType {
  SYSTEM = 'SYSTEM',
  UNIVERSITY = 'UNIVERSITY',
  CUSTOM = 'CUSTOM',
}

/**
 * Role metadata
 */
export interface RoleMetadata {
  code: RoleCode;
  displayName: string;
  type: RoleType;
  description: string;
}

/**
 * Role definitions with metadata
 */
export const ROLE_METADATA: Record<RoleCode, RoleMetadata> = {
  [RoleCode.SUPER_ADMIN]: {
    code: RoleCode.SUPER_ADMIN,
    displayName: 'Super Administrator',
    type: RoleType.SYSTEM,
    description: 'Full system access (Ministry level)',
  },
  [RoleCode.MINISTRY_ADMIN]: {
    code: RoleCode.MINISTRY_ADMIN,
    displayName: 'Ministry Administrator',
    type: RoleType.SYSTEM,
    description: 'Ministry-level administrator',
  },
  [RoleCode.VIEWER]: {
    code: RoleCode.VIEWER,
    displayName: 'Viewer',
    type: RoleType.SYSTEM,
    description: 'Read-only access',
  },
  [RoleCode.UNIVERSITY_ADMIN]: {
    code: RoleCode.UNIVERSITY_ADMIN,
    displayName: 'University Administrator',
    type: RoleType.UNIVERSITY,
    description: 'University-level administrator',
  },
  [RoleCode.REPORT_VIEWER]: {
    code: RoleCode.REPORT_VIEWER,
    displayName: 'Report Viewer',
    type: RoleType.CUSTOM,
    description: 'Read-only access for reports',
  },
};

/**
 * Check if role is a system role (cannot be deleted)
 */
export function isSystemRole(role: RoleCode): boolean {
  return ROLE_METADATA[role].type === RoleType.SYSTEM;
}

/**
 * Check if role is a university role
 */
export function isUniversityRole(role: RoleCode): boolean {
  return ROLE_METADATA[role].type === RoleType.UNIVERSITY;
}

/**
 * Check if role is a custom role
 */
export function isCustomRole(role: RoleCode): boolean {
  return ROLE_METADATA[role].type === RoleType.CUSTOM;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: RoleCode): string {
  return ROLE_METADATA[role].displayName;
}

/**
 * Get all system roles
 */
export function getSystemRoles(): RoleCode[] {
  return Object.values(RoleCode).filter(isSystemRole);
}

/**
 * Get all university roles
 */
export function getUniversityRoles(): RoleCode[] {
  return Object.values(RoleCode).filter(isUniversityRole);
}

/**
 * Get all custom roles
 */
export function getCustomRoles(): RoleCode[] {
  return Object.values(RoleCode).filter(isCustomRole);
}
