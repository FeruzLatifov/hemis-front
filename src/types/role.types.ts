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
