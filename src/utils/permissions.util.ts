/**
 * Permission Utilities
 *
 * Helper functions for permission checking
 * Synced with backend Spring Security
 */

import { RoleCode } from '../types/role.types';

/**
 * Check if user has a specific permission
 *
 * @example
 * hasPermission(['students:read', 'students:write'], 'students:read') // true
 * hasPermission(['students:read'], 'students:write') // false
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has ANY of the required permissions
 *
 * @example
 * hasAnyPermission(['students:read'], ['students:read', 'students:write']) // true
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has ALL of the required permissions
 *
 * @example
 * hasAllPermissions(['students:read', 'students:write'], ['students:read']) // true
 * hasAllPermissions(['students:read'], ['students:read', 'students:write']) // false
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has a specific role
 *
 * @example
 * hasRole(user, RoleCode.SUPER_ADMIN)
 */
export function hasRole(
  user: { roles?: RoleCode[] } | null,
  role: RoleCode
): boolean {
  return user?.roles?.includes(role) ?? false;
}

/**
 * Check if user has ANY of the required roles
 *
 * @example
 * hasAnyRole(user, [RoleCode.SUPER_ADMIN, RoleCode.MINISTRY_ADMIN])
 */
export function hasAnyRole(
  user: { roles?: RoleCode[] } | null,
  roles: RoleCode[]
): boolean {
  if (!user?.roles) return false;
  return roles.some((role) => user.roles!.includes(role));
}

/**
 * Check if user has ALL of the required roles
 */
export function hasAllRoles(
  user: { roles?: RoleCode[] } | null,
  roles: RoleCode[]
): boolean {
  if (!user?.roles) return false;
  return roles.every((role) => user.roles!.includes(role));
}

/**
 * Parse permission string to object
 *
 * @example
 * parsePermission('students:read') // { resource: 'students', action: 'read' }
 */
export function parsePermission(permission: string): {
  resource: string;
  action: string;
} {
  const [resource, action] = permission.split(':');
  return { resource, action };
}

/**
 * Group permissions by resource
 *
 * @example
 * groupPermissionsByResource(['students:read', 'students:write', 'faculty:read'])
 * // { students: ['read', 'write'], faculty: ['read'] }
 */
export function groupPermissionsByResource(
  permissions: string[]
): Record<string, string[]> {
  return permissions.reduce((acc, perm) => {
    const { resource, action } = parsePermission(perm);
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(action);
    return acc;
  }, {} as Record<string, string[]>);
}

/**
 * Check if user can read a resource
 */
export function canRead(permissions: string[], resource: string): boolean {
  return hasPermission(permissions, `${resource}:read`);
}

/**
 * Check if user can write to a resource
 */
export function canWrite(permissions: string[], resource: string): boolean {
  return hasPermission(permissions, `${resource}:write`);
}

/**
 * Check if user can delete from a resource
 */
export function canDelete(permissions: string[], resource: string): boolean {
  return hasPermission(permissions, `${resource}:delete`);
}

/**
 * Check if user has admin permissions (SUPER_ADMIN or MINISTRY_ADMIN)
 */
export function isAdmin(user: { roles?: RoleCode[] } | null): boolean {
  return hasAnyRole(user, [RoleCode.SUPER_ADMIN, RoleCode.MINISTRY_ADMIN]);
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: { roles?: RoleCode[] } | null): boolean {
  return hasRole(user, RoleCode.SUPER_ADMIN);
}

/**
 * Check if user is university admin
 */
export function isUniversityAdmin(user: { roles?: RoleCode[] } | null): boolean {
  return hasRole(user, RoleCode.UNIVERSITY_ADMIN);
}

/**
 * Check if user has read-only access (VIEWER role)
 */
export function isReadOnly(user: { roles?: RoleCode[] } | null): boolean {
  return hasRole(user, RoleCode.VIEWER) && !isAdmin(user);
}
